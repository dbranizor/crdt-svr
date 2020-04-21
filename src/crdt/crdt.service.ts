import { Injectable } from "@nestjs/common";
import { SvrSync, SvrSyncMsg, SvrMessage, ClientSyncMsg, MerkleCrdtMsg, ClientReSyncMsg } from "@derekbranizor/leeds-rel2itivetypes"
/**TODO: Remove after debugging */
import { LeedsMerkle } from './temp.merkle';
import { Observable, BehaviorSubject } from 'rxjs'

@Injectable()
export class CrdtService {
    constructor() { }
    public userMaps: Map<String, any> = new Map();
    private merkleTree: LeedsMerkle = null;
    public exchangeMsg(clientMessage: ClientSyncMsg): SvrSyncMsg {

        // If first set map and apply messages
        if (!this.userMaps.has(clientMessage.mTYpe)) {

            let messageMap = clientMessage.mText.new.reduce((acc, curr) => {
                curr['lastSynced'] = clientMessage.mText.lastSync;
                acc[curr.mTYpe] = curr;
                return acc;
            }, {})
            this.userMaps.set(clientMessage.mTYpe, messageMap);
            this.merkleTree = new LeedsMerkle(clientMessage.mText.new);
            return {
                mTYpe: SvrMessage.SyncResponse,
                mText: {
                    merkleTree: this.merkleTree.getTree().getLayersAsObject(),
                    new: []
                }
            };
        }



        // 1 get client messages Map
        // 2 Get server messages into flat array for sorting and filtering
        // 3 Sort messages oldest first
        // 4 Filter out older messages and get list of messages that have not been synced with client into seperate collection
        // 5 Update server messages with client messages and set group messages.
        // 6 Set client messages map
        // 7 Set Merkle Tree with NEW flat array of merkle updates
        // 8 Set syncServerMessage with new messages and computed merkle tree


        // 1 Get client messages map
        let serverGroupMessagesMap = this.userMaps.get(clientMessage.mTYpe)


        /**2 get server messages into flat array */
        let serverGroupMsgList: MerkleCrdtMsg[] = Object.keys(serverGroupMessagesMap).reduce((acc, curr) => {
            acc = [...acc, serverGroupMessagesMap[curr]];
            return acc;
        }, []);

        // 3 sort messages oldest first
        serverGroupMsgList.sort((a, b) => {
            return a.mText.logicalTime - b.mText.logicalTime;
        })


        // 4 filter sorted messages newer then last time stamp
        let lastSyncedCrdts: MerkleCrdtMsg[] = serverGroupMsgList.filter(s => s.clock.logicalTime > clientMessage.mText.lastSync);


        //5 Update server messages with client messages and set group messages
        clientMessage.mText.new.forEach(m => {
            m['lastSynced'] = clientMessage.mText.lastSync;
            if (!serverGroupMessagesMap[m.mTYpe]) {
                serverGroupMessagesMap[m.mTYpe] = m
                serverGroupMessagesMap[m.mTYpe]['lastSynced'] = clientMessage.mText.lastSync;
            } else {
                const message: MerkleCrdtMsg = serverGroupMessagesMap[m.mTYpe];
                // TODO: Should last-write win here (=)? Is this ever going to be an issue minus tests?
                if (message.mText.logicalCounter <= m.clock.logicalCounter) {
                    serverGroupMessagesMap[m.mTYpe] = m
                }
            }
        });

        // 6 Update serverGroupMessageList with client updates
        let updatedGroupMsgList: MerkleCrdtMsg[] = Object.keys(serverGroupMessagesMap).reduce((acc, curr) => {
            acc = [...acc, serverGroupMessagesMap[curr]];
            return acc;
        }, []);

        // 7 Sort with new messagesf
        updatedGroupMsgList.sort((a, b) => a.clock.logicalTime - b.clock.logicalTime);

        //  8 set client messages map  
        this.userMaps.set(clientMessage.mTYpe, serverGroupMessagesMap);


        // set svrsync message data
        this.merkleTree = new LeedsMerkle(updatedGroupMsgList);
        // Give client a merkle tree without only new updates
        let clientMsgMerkleTree = new LeedsMerkle(serverGroupMsgList);

        // Build server-sync message with new merkle-tree and new messages
        const svrSync: SvrSync = {
            merkleTree: clientMsgMerkleTree.getTree().getLayersAsObject(),
            new: lastSyncedCrdts
        }

        return {
            mTYpe: SvrMessage.SyncResponse,
            mText: svrSync
        }

    }

    public resyncMsg(clientRsyn: ClientReSyncMsg): SvrSyncMsg {
        if (!this.userMaps.has(clientRsyn.mTYpe)) {
            throw `Error: Sent a Non Existing Group`
        }

        // get group crdts
        let messageHash: MerkleCrdtMsg[] = this.userMaps.get(clientRsyn.mTYpe);
        let svcCrdts: MerkleCrdtMsg[] = Object.keys(messageHash).map(s => messageHash[s]);


        // get back range of CRDTs
        let lastSyncedCrdts: MerkleCrdtMsg[] = svcCrdts.filter(s => s.mText.logicalTime > clientRsyn.mText.rannge.first && s.mText.logicalTime < clientRsyn.mText.rannge.last)
            ;

        // Compute a merkle tree and make a sync response object
        const computedMerkleTree = new LeedsMerkle(svcCrdts);
        const svrSync: SvrSync = {
            merkleTree: computedMerkleTree.getTree().getLayersAsObject(),
            new: lastSyncedCrdts
        }

        // return compiled merkle
        return {
            mTYpe: SvrMessage.SyncResponse,
            mText: svrSync
        }

    }




}