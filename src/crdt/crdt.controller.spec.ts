import { Test, TestingModule } from '@nestjs/testing';
import { CrdtController } from './crdt.controller';
import { CrdtService } from './crdt.service';
import { MerkleCrdt, Msg, ClientSyncMsg, SvrSyncMsg, LeedsMerkle } from '@derekbranizor/leeds-rel2itivetypes';

const nov1st2019 = 1572566400;
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


const merkleTree: LeedsMerkle= new LeedsMerkle([nov1stMessage, nov1st2Message]);

const clientSyncMessage: ClientSyncMsg = {
  mTYpe: 'groupA',
  mText: {
    lastSync: nov1st2019,
    merkleTree: merkleTree.getTree(),
    new: [nov1stMessage, nov1st2Message]
  }
}


describe('Crdt Controller', () => {
  let controller: CrdtController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrdtController],
      providers: [CrdtService]
    }).compile();

    controller = module.get<CrdtController>(CrdtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle a client-message', () => {
    let syncResponse:any = controller.applyAndSync(clientSyncMessage)
    // let sync:SvrSyncMsg  = JSON.parse(syncResponse); 
    expect(syncResponse).toBeDefined();
    
    expect(Object.keys(syncResponse.mText.merkleTree)[0]).toBeDefined();
  })
});
