import { Injectable } from "@nestjs/common";
import { LeedsMerkle, SvrSync, SvrSyncMsg, SvrMessage, ClientSyncMsg, MerkleCrdtMsg, MerkleCrdt, Merkle, ClientReSyncMsg, ClientReSync, crdtMerkleToMsgMapper } from "@derekbranizor/leeds-rel2itivetypes"


@Injectable()
export class CrdtService {
    constructor() { }
    private userMaps: Map<String, any> = new Map();
    private merkleTree: LeedsMerkle = null;
    public exchangeMsg(clientMessage: ClientSyncMsg): SvrSyncMsg {

        // If first set map and apply messages
        if (!this.userMaps.has(clientMessage.mTYpe)) {
            this.userMaps.set(clientMessage.mTYpe, clientMessage.mText.new)
 
            this.merkleTree = new LeedsMerkle(clientMessage.mText.new);
            return {
                mTYpe: SvrMessage.SyncResponse,
                mText: {
                    merkleTree: this.merkleTree.getTree().getLayersAsObject(),
                    new: []
                }
            };
        }



        // 1 get client messages that aren't duplicates into flatt array

        // 2 get server messages into flat array

        // 3 filter messages newer then last time stamp

        // Update server messages with client messages that have greater logical counter

        // Merge in new messages

        // send messages + erkle to client

        // add 1 to messages.
        let serverGroupMessages: MerkleCrdtMsg[] = this.userMaps.get(clientMessage.mTYpe);


        /** Get client messages that are dupe's */
        const goodMessages: MerkleCrdt[] = clientMessage.mText.new.map(s => s.mText);

        /**get server messages into flat array */
        let serverGroupCrdts: MerkleCrdt[] = Object.keys(serverGroupMessages).reduce((acc, curr) => {
            acc = [...acc, serverGroupMessages[curr].mText];
            return acc;
        }, []);

        // filter messages newer then last time stamp
        let lastSyncedCrdts: MerkleCrdt[] = serverGroupCrdts.filter(s => s.logicalTime > clientMessage.mText.lastSync);

        // Update erver messages with client messages
        serverGroupCrdts = serverGroupCrdts.reduce<MerkleCrdt[]>((acc, curr) => {
            const updateMessage: MerkleCrdt = goodMessages.find(g => g.id === curr.id);
            if (updateMessage && curr.logicalCounter < updateMessage.logicalCounter) {
                acc = [...acc, updateMessage];
            } else {
                acc = [...acc, curr]
            }
            return acc;
        }, []);

        // Add new client messages
        let newClientMessages: MerkleCrdt[] = goodMessages.filter(m => !serverGroupCrdts.some(s => s.id === m.id));

        serverGroupCrdts = [...serverGroupCrdts, ...newClientMessages];

        // sort messages oldest first
        serverGroupCrdts.sort((a, b) => {
            return a.logicalTime - b.logicalTime;
        })


        // set messages
        serverGroupMessages = serverGroupCrdts.map<MerkleCrdtMsg>((s) => {
            return {
                mTYpe: clientMessage.mTYpe,
                mText: s

            }
        });
        this.userMaps.set(clientMessage.mTYpe, serverGroupMessages);

        // set svrsync message data
        const computedMerkleTree = new LeedsMerkle(serverGroupMessages);
        const svrSync: SvrSync = {
            merkleTree: computedMerkleTree.getTree().getLayersAsObject(),
            new: lastSyncedCrdts.map<MerkleCrdtMsg>((s) => {
                return {
                    mTYpe: clientMessage.mTYpe,
                    mText: s

                }
            })
        }

        // Update merkle
        this.merkleTree = new LeedsMerkle(serverGroupMessages);

        // return compiled merkle
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
        let messages: MerkleCrdtMsg[] = this.userMaps.get(clientRsyn.mTYpe);
        let svcCrdts = messages.map(s => s.mText) as any;


        // get back range of CRDTs
        let lastSyncedCrdts: MerkleCrdt[] = svcCrdts.filter(s => s.logicalTime > clientRsyn.mText.rannge.first && s.logicalTime < clientRsyn.mText.rannge.last);

        // Compute a merkle tree and make a sync response object
        const computedMerkleTree = new LeedsMerkle(messages);
        const svrSync: SvrSync = {
            merkleTree: computedMerkleTree.getTree().getLayersAsObject(),
            new: lastSyncedCrdts.map(crdtMerkleToMsgMapper)
        }

        // return compiled merkle
        return {
            mTYpe: SvrMessage.SyncResponse,
            mText: svrSync
        }

    }




}