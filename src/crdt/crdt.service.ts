import { Injectable } from "@nestjs/common";
import {
    SvrSync,
    SvrSyncMsg,
    SvrMessage,
    ClientSyncMsg,
    MerkleCrdtMsg,
    unpackHlc
} from "@derekbranizor/leeds-rel2itivetypes"

@Injectable()
export class CrdtService {
    constructor() { }
    public userMaps: Map<String, any> = new Map();
    private merkleTree: Map<String, any> = new Map();

    public clientInitiatedSync(clientMessage: ClientSyncMsg): SvrSyncMsg {

        // If first set map and apply messages
        if (!this.userMaps.has(clientMessage.mTYpe)) {

            let messageList = [...clientMessage.mText.new.map(c => c.mText)]
            this.userMaps.set(clientMessage.mTYpe, messageList);
            this.merkleTree.set(clientMessage.mTYpe, clientMessage.mText.merkleTree || {});
            return {
                mTYpe: SvrMessage.SyncResponse,
                mText: {
                    merkleTree: this.merkleTree.get(clientMessage.mTYpe),
                    new: []
                }
            };
        }


        let newClientGroupMessages = this.getGroupMessages(clientMessage);

        return {
            mTYpe: SvrMessage.SyncResponse,
            mText: {
                merkleTree: this.merkleTree.get(clientMessage.mTYpe),
                new: newClientGroupMessages
            }
        }
    }

    public exchangeMsg(clientMessage): SvrSyncMsg {




        /** Tree has been updated since the last successfull clientInitiatedSync. Resync again */
        if ((Object.keys(this.merkleTree.get(clientMessage.mTYpe) || [])[0] || "") !== clientMessage.mText.previousMerkleTree) {
            return this.clientInitiatedSync(clientMessage);
        }

        // 1 get client messages Map
        // 2 Update server messages with client messages and set group messages.
        // 3 Set Merkle Tree wth clients good merkle
        // 4 Set syncServerMessage with empty messages and the updated merkle tree


        // 1 Get client messages map
        let serverGroupMessageList = this.userMaps.get(clientMessage.mTYpe)


        serverGroupMessageList = [...serverGroupMessageList, ...clientMessage.mText.new.map(c => c.mText)]

        serverGroupMessageList.sort((a, b) => {
            return a.logicalTime - b.logicalTime;
        })

        // 3 set client messages map  
        this.userMaps.set(clientMessage.mTYpe, serverGroupMessageList);


        // 4  set svrsync message data
        if (!clientMessage.mText.merkleTree) {
            throw Error(`No Merkle Sent to Complete Sync!! ${JSON.stringify(clientMessage)}`)
        }
        this.merkleTree.set(clientMessage.mTYpe, clientMessage.mText.merkleTree);

        // Build server-sync message with new merkle-tree and new messages
        const svrSync: SvrSync = {
            merkleTree: this.merkleTree.get(clientMessage.mTYpe),
            new: []
        }

        return {
            mTYpe: SvrMessage.SyncResponse,
            mText: svrSync
        }

    }

    // 1 get group\team messages
    // 2 Get server messages into flat array for sorting and filtering
    // 3 Sort messages oldest first
    // 4 Filter out older messages and get list of messages that have not been synced with client into seperate collection
    private getGroupMessages(clientMessage): MerkleCrdtMsg[] {

        // 1 Get client messages map
        let serverGroupMsgList: any[] = this.userMaps.get(clientMessage.mTYpe)

        // 3 sort messages oldest first
        // serverGroupMsgList.sort(this.cmp)
        const {count, id, ts} = unpackHlc(clientMessage.mText.lastSync)
        serverGroupMsgList.sort((a, b) => {
            return a.logicalTime - b.logicalTime;
        })
        const lastSyncedCrdts = serverGroupMsgList.filter(s => {

            //s.clock.logicalTime > clientMessage.mText.lastSync
            if(s.logicalTime === ts){
                if(s.logicalCounter === count){
                        return s.nodeID > id
                }
                return s.logicalCounter > count             
            }
            return s.logicalTime > ts
        });



        return lastSyncedCrdts;

    }

    cmp(one, two) {
        if (one.logicalTime === two.logicalTime) {
            if (one.logicalCounter === two.logicalCounter) {
                if(one.row === two.row){
                    return 0
                }
                return one.row < two.row ? -1 : 1;
            }


            return one.logicalCounter - two.logicalCounter
        }

        return one.logicalTime - two.logicalTime
    }




}