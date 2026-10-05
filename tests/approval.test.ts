import{describe,expect,it}from"vitest";import{requireApproval}from"../lib/security/financial-command";describe("financial approval",()=>{it("fails closed when approval is missing",()=>expect(()=>requireApproval(undefined)).toThrow("approval_required"));it("accepts a well-formed approval",()=>expect(requireApproval({approvedBy:"user-1",approvedAt:"2026-10-04T12:00:00Z",intentHash:"sha256:abc"}).approvedBy).toBe("user-1"))});

describe("approval intent binding",()=>{
  const approval={
    approvedBy:"user-1",
    approvedAt:"2026-10-05T03:00:00Z",
    intentHash:"sha256:intent-A"
  };

  const context={
    expectedApprover:"user-1",
    expectedIntentHash:"sha256:intent-A",
    now:"2026-10-05T03:02:00Z",
    maxAgeMs:300000
  };

  it("accepts approval bound to the intended command",()=>{
    expect(requireApproval(approval,context)).toBe(approval);
  });

  it("rejects approval copied to another intent",()=>{
    expect(()=>requireApproval(approval,{
      ...context,
      expectedIntentHash:"sha256:intent-B"
    })).toThrow("approval_intent_mismatch");
  });

  it("rejects approval from another principal",()=>{
    expect(()=>requireApproval(approval,{
      ...context,
      expectedApprover:"attacker"
    })).toThrow("approval_principal_mismatch");
  });

  it("rejects expired approval",()=>{
    expect(()=>requireApproval(approval,{
      ...context,
      now:"2026-10-05T03:10:00Z"
    })).toThrow("approval_expired");
  });

  it("rejects approval timestamps from the future",()=>{
    expect(()=>requireApproval(approval,{
      ...context,
      now:"2026-10-05T02:59:59Z"
    })).toThrow("approval_from_future");
  });

  it("rejects invalid approval windows",()=>{
    expect(()=>requireApproval(approval,{
      ...context,
      maxAgeMs:0
    })).toThrow("invalid_approval_window");
  });
});
