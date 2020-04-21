import { ClientSyncMsg, SvrSyncMsg, ClientReSync, ClientReSyncMsg } from "@derekbranizor/leeds-rel2itivetypes";
import { Body, Put, Controller, Get, Post } from "@nestjs/common";
import { CrdtService } from "./crdt.service";



@Controller('crdt')
export class CrdtController {
    constructor(private readonly crdtService: CrdtService){}
    @Post()
    applyAndSync(@Body() crdtSyncMsg: ClientSyncMsg):any  {
        console.log('dingo getting sync response')
        const msg: SvrSyncMsg = this.crdtService.exchangeMsg(crdtSyncMsg)
        return msg
    }

    @Put()
    reSync(@Body() crdtSyncMsg: ClientReSyncMsg):any  {
        console.log('dingo getting sync response')
        const msg: SvrSyncMsg = this.crdtService.resyncMsg(crdtSyncMsg)
        return msg
    }

}