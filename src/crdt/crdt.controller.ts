import { ClientSyncMsg, SvrSyncMsg } from "@derekbranizor/leeds-rel2itivetypes";
import { Body, Put, Controller, Get } from "@nestjs/common";
import { CrdtService } from "./crdt.service";



@Controller('crdt')
export class CrdtController {
    constructor(private readonly crdtService: CrdtService){}
    @Put()
    applyAndSync(@Body() crdtSyncMsg: ClientSyncMsg):any  {
        console.log('dingo getting sync response')
        const msg: SvrSyncMsg = this.crdtService.exchangeMsg(crdtSyncMsg)
        return msg
    }

}