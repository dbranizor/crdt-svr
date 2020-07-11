import { Injectable } from "@nestjs/common";
import { 
    SvrSync, 
    SvrSyncMsg, 
    SvrMessage, 
    ClientSyncMsg, 
    MerkleCrdtMsg,
} from "@derekbranizor/leeds-rel2itivetypes"
import { ClientCompleteSync } from "@derekbranizor/leeds-rel2itivetypes/dist/main";

@Injectable()
export class CrdtService {
    constructor() { }
    public userMaps: Map<String, any> = new Map();
    private merkleTree: Map<String, any> = new Map();

    public clientInitiatedSync(clientMessage: ClientSyncMsg): SvrSyncMsg {

        // If first set map and apply messages
        if (!this.userMaps.has(clientMessage.mTYpe)) {

            let messageMap = clientMessage.mText.new.reduce((acc, curr) => {
                // curr['lastSynced'] = clientMessage.mText.lastSync;
                acc[curr.mTYpe] = curr;
                return acc;
            }, {})
            this.userMaps.set(clientMessage.mTYpe, messageMap);
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
        if((Object.keys(this.merkleTree.get(clientMessage.mTYpe))[0] || "") !== clientMessage.mText.previousMerkleTree){
            return this.clientInitiatedSync(clientMessage);
        }

        // 1 get client messages Map
        // 2 Update server messages with client messages and set group messages.
        // 3 Set Merkle Tree wth clients good merkle
        // 4 Set syncServerMessage with empty messages and the updated merkle tree


        // 1 Get client messages map
        let serverGroupMessagesMap = this.userMaps.get(clientMessage.mTYpe)


        //2 Update server messages with client messages and set group messages
        clientMessage.mText.new.forEach(m => {
            // m['lastSynced'] = clientMessage.mText.lastSync;
            if (!serverGroupMessagesMap[m.mTYpe]) {
                serverGroupMessagesMap[m.mTYpe] = m
                // serverGroupMessagesMap[m.mTYpe]['lastSynced'] = clientMessage.mText.lastSync;
            } else {
                const message: MerkleCrdtMsg = serverGroupMessagesMap[m.mTYpe];
                // TODO: Should last-write win here (=)? Is this ever going to be an issue minus tests?
                if (message.mText.logicalCounter <= m.clock.logicalCounter) {
                    serverGroupMessagesMap[m.mTYpe] = m
                }
            }
        });


        // 3 set client messages map  
        this.userMaps.set(clientMessage.mTYpe, serverGroupMessagesMap);


        // 4  set svrsync message data
        if(!clientMessage.mText.merkleTree){
            throw Error(`No Merkle Sent to Complete Sync!! ${JSON.stringify(clientMessage)}`)
        }
        this.merkleTree.set(clientMessage.mTYpe, clientMessage.mText.merkleTree ); 

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
    private getGroupMessages(clientMessage: ClientSyncMsg): MerkleCrdtMsg[] {


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


        const lastSyncedCrdts: MerkleCrdtMsg[] = serverGroupMsgList.filter(s => s.clock.logicalTime > clientMessage.mText.lastSync);
        
        return lastSyncedCrdts;
    }
    
    // 4 filter sorted messages newer then last time stamp



}