import { Audit } from './Audit';
import { AuditConfig } from './types';

const auditConfig: AuditConfig = {
    sleepTime: 500,  // sleep time in milliseconds
    logLevel: 'info',  // log level
    logFile: 'combined.log',  // log file name
    debugMode: false,  // debug mode,
    channelName: process.env.CHANNEL_NAME || "" // visible here; https://web.shipbob.com/UserDetails/#/StoreManagement
};

const main = async () => {

    const audit = await Audit.create(auditConfig);
    audit.runAudit().catch(error => console.error('Audit failed:', error.message));
    // audit.getShippingMethods().then((data) => {
    //     console.log(data);
    //     console.log(`-----------------------`);
    // }).catch(error => console.error('getting shipping methods  failed:', error.message));
}

main();