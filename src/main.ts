import { Audit } from './Audit';
import { AuditConfig } from './types';

const auditConfig: AuditConfig = {
    sleepTime: 500,
    logLevel: 'info',
    logFile: 'combined.log',
    debugMode: false
};

const main = async () => {
    const audit = await Audit.create(auditConfig);
    audit.runAudit().catch(error => console.error('Audit failed:', error.message));
}

main();