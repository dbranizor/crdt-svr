import { SHA256, WordArray } from 'crypto-js'
import { returnMerkleCrdtHash, MerkleCrdt, Msg, Merkle, MerkleCrdtMsg, ClientReSyncMsg, } from "@derekbranizor/leeds-rel2itivetypes"
import { MerkleTree } from 'merkletreejs'

/**
 * TODO: Need some type of factory of merkle tree that coorespond their particular CRDT types (table crdt, geo crdt etc)
 */
export class LeedsMerkle implements Merkle {
    private hashMap: Map<string, string> = new Map();
    private messages: Msg<MerkleCrdt>[]
    // @ts-ignore
    private tree: MerkleTree;


    constructor(messages: Msg<MerkleCrdt>[]) {
        this.messages = messages;
        this.construct(this.messages)
    }

    public setHash(hash: string, id: string): void {

        this.hashMap.set(hash, id);
    }
    public getHash(hash: string): string {
        // @ts-ignore
        return this.hashMap.get(hash);
    }


    public getRoot() {
        if (!this.tree) {
            this.construct(this.messages)
        }
        return this.tree.getHexRoot()
    }

    public getTree(): MerkleTree {
        return this.construct(this.messages)

    }

    construct(messages: Msg<MerkleCrdt>[]): MerkleTree {

        const leaves = messages.map(m =>

            this.returnSHA256Hash(m)
        )
        this.tree = new MerkleTree(leaves, SHA256)
        return this.tree
    }


    public returnSHA256Hash(m: Msg<MerkleCrdt>): WordArray {
        const crdt: MerkleCrdt = m.mText;
        /** Alphabetically grab fields that make up CRDT changes */
        const bufferHash = returnMerkleCrdtHash(m.mText);
        const stringHash = bufferHash.toString();

        this.setHash(stringHash, m.mTYpe);
        return bufferHash;
    }

    public returnHash(hashAsObj: { [key: string]: any }): unknown {
        if (typeof hashAsObj === 'object' && hashAsObj !== null) {
            return Object.keys(hashAsObj).map(function (s: string) {

                if (!hashAsObj[s]) {
                    // flatten
                    //@ts-ignore
                    const hash = [].concat(...Object.keys(hashAsObj))[0]
                    // For now. Just return first hash.
                    // Algorithm is: Sort oldest to newest. Create merkle. First hash that matches both ->
                    // is a date where a new msg query is ran from that for diffs
                    //@ts-ignore
                    const msgHash = this.hashMap.get(hash)
                    if (!msgHash) {
                        throw `No Hash Saved for : ${msgHash}`
                    }
                    return msgHash;

                } else {
                    // Garbage typescript abomination of javascript
                    // @ts-ignore
                    return this.returnHash(hashAsObj[s])
                }



            }.bind(this))
        } else {
            return hashAsObj
        }


    }

    public bfs(localTree: any, peerTree: MerkleTree): unknown {
        var queue = []
        const rootKey = Object.keys(localTree)[0]
        // need tree
        queue.push(localTree[rootKey])
        let count = 0;
        while (queue.length > 0) {
            const node: any = queue[0];

            if (Object.keys(node)[0]) {
                //   console.log(`Walking through level ${count} ${Object.keys(node)[0]}`)


                if (node[Object.keys(node)[0]]) {
                    // return part of merkle branch
                    if (peerTree.getHexProof(Object.keys(node)[0]).length > 0) {
                        return node[Object.keys(node)[0]];
                    }
                    queue.push(node[Object.keys(node)[0]])
                } else {
                    // return leaf
                    console.log('leaf', Object.keys(node)[0])
                    if (peerTree.getHexProof(Object.keys(node)[0]).length > 0) {
                        return Object.keys(node)[0];
                    }
                }

            }

            if (Object.keys(node)[1]) {

                if (node[Object.keys(node)[1]]) {
                    // return part of merkle branch
                    if (peerTree.getHexProof(Object.keys(node)[1]).length > 0) {
                        return node[Object.keys(node)[1]];
                    }
                    queue.push(node[Object.keys(node)[1]])
                } else {
                    console.log('leaf', Object.keys(node)[1])
                    // return leaf
                    if (peerTree.getHexProof(Object.keys(node)[1]).length > 0) {
                        return Object.keys(node)[1];
                    }
                }

            }


            count++
            queue.shift()

        }
    }




}





