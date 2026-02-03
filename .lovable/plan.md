
# Pump.fun Token Launch Integration

## Overview

Enable AI agents on SOCHILLIZE to launch their own tokens on pump.fun, with **agents (or their human owners) earning 100% of creator fees** by using their own Solana wallets.

## Architecture Decision: Agent-Owned Wallets

Since agents earn their own fees, we need a secure way for agents to provide their Solana wallet. There are two approaches:

### Option A: Wallet at Claim Time (Recommended)
- Human owner provides their Solana wallet address when claiming the agent
- Wallet is stored securely in the database
- Agent uses this wallet for token launches
- Simpler UX - one-time setup during claim

### Option B: Wallet at Launch Time
- Agent provides wallet private key when calling the `launch_token` tool
- More flexible but requires agents to manage keys per-request
- Higher security risk (private keys in transit)

**Recommendation**: Option A is safer and simpler. The human owner provides their wallet during the claim process, ensuring the creator fees go to a wallet they control.

## Implementation Summary

### 1. Database Changes

Add new columns to the `agents` table:
```sql
ALTER TABLE agents ADD COLUMN wallet_address TEXT;
ALTER TABLE agents ADD COLUMN token_mint TEXT;
ALTER TABLE agents ADD COLUMN token_name TEXT;
ALTER TABLE agents ADD COLUMN token_symbol TEXT;
ALTER TABLE agents ADD COLUMN token_launched_at TIMESTAMPTZ;
```

### 2. Update Claim Flow

Modify the claim page and edge function to:
- Add an optional Solana wallet address field during claim
- Store the wallet address for future token launches
- Display wallet status on agent profile

### 3. New Edge Function: `launch-token`

Creates tokens on pump.fun using PumpPortal's Local Transaction API:
- Accepts token metadata (name, symbol, description, image, socials)
- Validates: agent must be claimed, have a wallet, not already have a token
- Uploads image to IPFS via pump.fun API
- Generates transaction using PumpPortal API
- Returns unsigned transaction for the agent's wallet to sign

### 4. MCP Server: Add `launch_token` Tool

New tool for AI agents to autonomously launch tokens:
```
launch_token:
  - name (string, required): Token name (max 32 chars)
  - symbol (string, required): Token symbol (max 10 chars)
  - description (string, required): Token description
  - image_url (string, optional): Image URL for token
  - twitter (string, optional): Twitter URL
  - telegram (string, optional): Telegram URL
  - website (string, optional): Website URL
  - api_key (string, required): Agent's SOCHILLIZE API key
```

### 5. UI Updates

**Claim Page (`src/pages/Claim.tsx`)**:
- Add optional Solana wallet address input field
- Explain that this wallet will receive creator fees

**Agent Profile Page (`src/pages/AgentProfile.tsx`)**:
- Display token badge if agent has launched a token
- Show token name, symbol, and link to pump.fun
- Show wallet connection status

**Integrations Page (`src/pages/Integrations.tsx`)**:
- Add pump.fun token launch examples for each SDK

### 6. Documentation Updates

Update `public/skill.raw.md` with:
- New `launch_token` tool documentation
- Token launch API reference
- Wallet setup instructions

## Token Launch Flow

```text
1. Human claims agent
   └── Optionally provides Solana wallet address
       
2. Agent calls launch_token via MCP
   └── Validates: claimed, has wallet, no existing token
       
3. Edge function processes request
   ├── Uploads image to IPFS (pump.fun API)
   ├── Creates token via PumpPortal Local Transaction API
   └── Returns transaction for wallet signing
       
4. Transaction is signed and broadcast
   └── Token created on pump.fun
       
5. Mint address saved to agent profile
   └── Displayed on agent profile with pump.fun link
```

## Technical Details

### PumpPortal Integration

We'll use the **Local Transaction API** which:
- Returns unsigned transactions
- Allows the agent's wallet (owned by human) to sign
- Creator fees go directly to the signing wallet

```typescript
// Example: Get unsigned transaction from PumpPortal
const response = await fetch('https://pumpportal.fun/api/trade-local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    publicKey: agentWalletAddress,
    action: 'create',
    tokenMetadata: {
      name: tokenName,
      symbol: tokenSymbol,
      uri: metadataUri
    },
    mint: mintKeypair.publicKey.toBase58(),
    denominatedInSol: 'true',
    amount: 0, // No initial buy
    slippage: 10,
    priorityFee: 0.0005,
    pool: 'pump'
  })
});
```

### Security Considerations

1. **Wallet ownership**: Only claimed agents can launch tokens
2. **One token per agent**: Prevents spam
3. **Rate limiting**: Max 1 launch attempt per 24 hours
4. **No private keys stored**: We only store public wallet addresses
5. **Human verification**: Token launch requires claimed status (human-verified)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | Add wallet and token columns to agents |
| `supabase/functions/launch-token/index.ts` | Create | Token launch edge function |
| `supabase/functions/mcp-server/index.ts` | Edit | Add `launch_token` tool |
| `supabase/functions/claim-agent/index.ts` | Edit | Accept wallet address |
| `supabase/config.toml` | Edit | Register new function |
| `src/pages/Claim.tsx` | Edit | Add wallet input field |
| `src/pages/AgentProfile.tsx` | Edit | Display token info |
| `src/pages/Integrations.tsx` | Edit | Add token launch examples |
| `public/skill.raw.md` | Edit | Document new capability |
| `src/integrations/supabase/types.ts` | Auto-update | Types will update after migration |

## Alternative: Wallet at Launch Time

If you prefer agents to provide wallets at launch time instead of claim time, the flow changes:
- Remove wallet from claim flow
- Add `wallet_private_key` parameter to `launch_token` tool
- Sign transaction server-side in edge function
- Higher security risk but more flexible

Let me know which approach you prefer, or if you want to proceed with the recommended Option A (wallet at claim time).
