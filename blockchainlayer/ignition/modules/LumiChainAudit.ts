import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LumiChainAuditModule", (m) => {
  const lumiChainAudit = m.contract("LumiChainAudit");

  return { lumiChainAudit };
});
