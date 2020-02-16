import { Test, TestingModule } from '@nestjs/testing';
import { CrdtService } from './crdt.service';
import { Msg, MerkleCrdt, ClientSyncMsg, ClientReSyncMsg, Merkle, LeedsMerkle } from '@derekbranizor/leeds-rel2itivetypes';

const oct29th2019 = 1572480000;
const nov1st2019 = 1572566400;
const nov122019 = 1573516800;
const nov152019 = 1573776000
const nov162019 = 1573862400
const nov172019 = 1573948800



const nov1stMessage: Msg<MerkleCrdt> = {
  mTYpe: 'groupA',
  mText: {
    field: 'name',
    logicalCounter: 0,
    logicalTime: nov1st2019,
    id: '1',
    row: 'row1',
    table: 'customer',
    value: 'positive'
  }
}

const nov1st2Message: Msg<MerkleCrdt> = {
  mTYpe: 'groupA',
  mText: {
    field: 'name',
    logicalCounter: 0,
    logicalTime: nov1st2019,
    id: '2',
    row: 'row2',
    table: 'customer',
    value: 'positive'
  }
}

const nov12thMessage: Msg<MerkleCrdt> = {
  mTYpe: 'groupA',
  mText: {
    field: 'name',
    logicalCounter: 0,
    logicalTime: nov122019,
    id: '2',
    row: 'row2',
    table: 'customer',
    value: 'positive'
  }
}

const nov15thMessage: Msg<MerkleCrdt> = {
  mTYpe: 'groupA',
  mText: {
    field: 'name',
    logicalCounter: 0,
    logicalTime: nov152019,
    id: '3',
    row: 'row3',
    table: 'customer',
    value: 'positive'
  }
}

const nov16thMessage: Msg<MerkleCrdt> = {
  mTYpe: 'groupA',
  mText: {
    field: 'name',
    logicalCounter: 0,
    logicalTime: nov162019,
    id: 'row4',
    row: 'row4',
    table: 'customer',
    value: 'positive'
  }
}

const nov17thMessage: Msg<MerkleCrdt> = {
  mTYpe: 'groupA',
  mText: {
    field: 'name',
    logicalCounter: 0,
    logicalTime: nov172019,
    id: '5',
    row: 'row4',
    table: 'customer',
    value: 'positive'
  }
}

const merkleTree: LeedsMerkle = new LeedsMerkle([nov1stMessage, nov1st2Message]);

const clientSyncMessage: ClientSyncMsg = {
  mTYpe: 'groupA',
  mText: {
    lastSync: nov1st2019,
    merkleTree: merkleTree.getTree(),
    new: [nov1stMessage, nov1st2Message]
  }
}

const client2SyncMessage1: ClientSyncMsg = {
  mTYpe: 'groupA',
  mText: {
    lastSync: oct29th2019,
    merkleTree: merkleTree.getTree(),
    new: [nov12thMessage, nov15thMessage]
  }
}

const client1SyncMessage2: ClientSyncMsg = {
  mTYpe: 'groupA',
  mText: {
    lastSync: nov1st2019,
    merkleTree: merkleTree.getTree(),
    new: [nov15thMessage]
  }
}


describe('CrdtService', () => {
  let service: CrdtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrdtService],
    }).compile();

    service = module.get<CrdtService>(CrdtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });



  it('should add a message and return no new messsages', () => {
    const svrSyncResponse = service.exchangeMsg(clientSyncMessage);
    expect(svrSyncResponse).toBeDefined();
    expect(svrSyncResponse.mText.new.length).toEqual(0);
    expect(svrSyncResponse.mText.merkleTree.getHexRoot()).toBeDefined()

    const svrSyncResponseToClient2 = service.exchangeMsg(client2SyncMessage1);
    expect(svrSyncResponseToClient2).toBeDefined();
    expect(svrSyncResponseToClient2.mText.new.length).toEqual(2);
    expect(svrSyncResponseToClient2.mText.new[0].mText.id).toEqual('1');

    const svrSyncResponseBackToClient1 = service.exchangeMsg(client1SyncMessage2);
    expect(svrSyncResponseBackToClient1).toBeDefined();
    expect(svrSyncResponseBackToClient1.mText.new.length).toEqual(2);
  })

  it('should resync with a client that is missing CRDTs', () => {
    /** If Client One Updates Server */
    const clientOneUpdatesSvr: ClientSyncMsg = {
      mTYpe: 'groupA',
      mText: {
        lastSync: nov1st2019,
        merkleTree: merkleTree.getTree(),
        new: [nov1stMessage, nov12thMessage, nov16thMessage]
      }
    }
    const merkleTest2 = new LeedsMerkle([nov1stMessage, nov12thMessage, nov16thMessage])
    const merkle: Merkle = new LeedsMerkle([nov1stMessage, nov12thMessage, nov16thMessage])
    const svr1SyncResponse = service.exchangeMsg(clientOneUpdatesSvr);
    const svrTree = svr1SyncResponse.mText.merkleTree.getHexRoot()
    expect(svr1SyncResponse).toBeDefined();
    expect(svr1SyncResponse.mText.new.length).toEqual(0);
    expect(svrTree).toEqual(merkle.getTree().getHexRoot());

    /** When client-two updates server (Merkle trees' in client-sync NOT under test-- throwaway) */
    const clientTwoUpdatesSvr: ClientSyncMsg = {
      mTYpe: 'groupA',
      mText: {
        lastSync: nov1st2019,
        merkleTree: merkleTree.getTree(),
        new: [nov15thMessage]
      }
    }
    const svr2SyncResponse = service.exchangeMsg(clientTwoUpdatesSvr);
    const client2Merkle: Merkle = new LeedsMerkle([nov1stMessage, nov12thMessage, nov15thMessage, nov16thMessage])
    expect(svr2SyncResponse.mText.merkleTree.getHexRoot()).toEqual(client2Merkle.getTree().getHexRoot());

    // Then Client one's new sync message will be off and merkles will not match
    const clientOneUpdatesSvr2: ClientSyncMsg = {
      mTYpe: 'groupA',
      mText: {
        lastSync: nov162019,
        merkleTree: merkleTree.getTree(),
        new: [nov17thMessage]
      }
    }
    const client1MerkleUpdate: Merkle = new LeedsMerkle([nov1stMessage, nov12thMessage, nov16thMessage, nov17thMessage])

    const svr1SyncResponse2 = service.exchangeMsg(clientOneUpdatesSvr2);
    expect(svr1SyncResponse2.mText.merkleTree.getHexRoot()).not.toBe(client1MerkleUpdate.getTree().getHexRoot());

    const svr1ReSyncResponse1 = service.resyncMsg({
      mTYpe: 'groupA',
      mText: {
        merkleTree: client1MerkleUpdate.getTree(),
        rannge: {
          first: nov1st2019,
          last: nov162019
        }
      }
    })

    expect(svr1ReSyncResponse1).toBeDefined();
    expect(svr1ReSyncResponse1.mText.new.length).toEqual(2);

  })
});
