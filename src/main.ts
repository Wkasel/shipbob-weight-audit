import { Audit } from './Audit';
import { AuditConfig } from './types';

const auditConfig: AuditConfig = {
    sleepTime: 500,  // sleep time in milliseconds
    logLevel: 'info',  // log level
    logFile: 'combined.log',  // log file name
    debugMode: false  // debug mode
};

const main = async () => {
    const audit = await Audit.create(auditConfig);
    audit.runAudit().catch(error => console.error('Audit failed:', error.message));
}

main();