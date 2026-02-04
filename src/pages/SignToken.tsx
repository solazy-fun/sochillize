import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Coins, 
  AlertTriangle,
  Rocket
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Connection, Transaction, VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

interface TokenInfo {
  name: string;
  symbol: string;
  description: string;
  mint: string;
  wallet: string;
  metadata_uri?: string;
}

interface SigningInfo {
  transaction: string;
  mint_secret_key: string;
  instructions: string;
}

interface LaunchData {
  token: TokenInfo;
  signing: SigningInfo;
  message: string;
}

type SigningStatus = "idle" | "connecting" | "connected" | "signing" | "broadcasting" | "success" | "error";

// Phantom wallet types
interface PhantomProvider {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>;
  publicKey: { toBase58: () => string } | null;
  isConnected: boolean;
}

const getPhantomProvider = (): PhantomProvider | null => {
  if (typeof window !== "undefined") {
    const provider = (window as any).phantom?.solana;
    if (provider?.isPhantom) {
      return provider as PhantomProvider;
    }
  }
  return null;
};

const SignToken = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [launchData, setLaunchData] = useState<LaunchData | null>(null);
  const [status, setStatus] = useState<SigningStatus>("idle");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [phantom, setPhantom] = useState<PhantomProvider | null>(null);

  // Parse launch data from URL params
  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = JSON.parse(atob(dataParam));
        setLaunchData(decoded);
      } catch (err) {
        console.error("Failed to parse launch data:", err);
        setError("Invalid launch data. Please try again from the token launch flow.");
      }
    } else {
      setError("No token data provided. Please initiate a token launch first.");
    }
  }, [searchParams]);

  // Check for Phantom wallet on mount
  useEffect(() => {
    const provider = getPhantomProvider();
    setPhantom(provider);
    
    if (provider?.isConnected && provider.publicKey) {
      setWalletAddress(provider.publicKey.toBase58());
      setStatus("connected");
    }
  }, []);

  const connectWallet = useCallback(async () => {
    const provider = getPhantomProvider();
    
    if (!provider) {
      toast({
        title: "Phantom Not Found",
        description: "Please install Phantom wallet extension",
        variant: "destructive",
      });
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setStatus("connecting");
    
    try {
      const { publicKey } = await provider.connect();
      const address = publicKey.toBase58();
      setWalletAddress(address);
      setPhantom(provider);
      setStatus("connected");
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 4)}...${address.slice(-4)}`,
      });
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setStatus("error");
      setError(err.message || "Failed to connect wallet");
      toast({
        title: "Connection Failed",
        description: err.message || "Could not connect to Phantom",
        variant: "destructive",
      });
    }
  }, [toast]);

  const signAndBroadcast = useCallback(async () => {
    if (!phantom || !launchData || !walletAddress) {
      toast({
        title: "Not Ready",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Verify wallet matches expected wallet
    if (walletAddress !== launchData.token.wallet) {
      toast({
        title: "Wrong Wallet",
        description: `Please connect the wallet ${launchData.token.wallet.slice(0, 8)}... that was registered with this agent`,
        variant: "destructive",
      });
      return;
    }

    setStatus("signing");
    setError(null);

    try {
      // Decode the base58 transaction
      const transactionBytes = bs58.decode(launchData.signing.transaction);
      
      // Decode mint secret key and create keypair
      const mintSecretKeyBytes = bs58.decode(launchData.signing.mint_secret_key);
      const mintKeypair = Keypair.fromSecretKey(mintSecretKeyBytes);
      
      // Deserialize the transaction (try both legacy and versioned)
      let transaction: Transaction | VersionedTransaction;
      
      try {
        // Try as versioned transaction first
        transaction = VersionedTransaction.deserialize(transactionBytes);
      } catch {
        // Fall back to legacy transaction
        transaction = Transaction.from(transactionBytes);
      }

      // Sign with mint keypair first
      if (transaction instanceof VersionedTransaction) {
        transaction.sign([mintKeypair]);
      } else {
        transaction.partialSign(mintKeypair);
      }

      // Sign with user's wallet via Phantom
      const signedTx = await phantom.signTransaction(transaction);
      
      setStatus("broadcasting");

      // Connect to Solana mainnet and send
      const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
      
      let signature: string;
      if (signedTx instanceof VersionedTransaction) {
        signature = await connection.sendTransaction(signedTx, {
          skipPreflight: false,
          maxRetries: 3,
        });
      } else {
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });
      }

      console.log("Transaction submitted:", signature);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, "confirmed");
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      setTxSignature(signature);
      setStatus("success");
      
      toast({
        title: "Token Launched! 🚀",
        description: `$${launchData.token.symbol} is now live on pump.fun!`,
      });

    } catch (err: any) {
      console.error("Signing/broadcast error:", err);
      setStatus("error");
      setError(err.message || "Transaction failed");
      toast({
        title: "Launch Failed",
        description: err.message || "Could not complete the transaction",
        variant: "destructive",
      });
    }
  }, [phantom, launchData, walletAddress, toast]);

  const disconnectWallet = useCallback(async () => {
    if (phantom) {
      try {
        await phantom.disconnect();
      } catch (e) {
        console.error("Disconnect error:", e);
      }
    }
    setWalletAddress(null);
    setStatus("idle");
  }, [phantom]);

  if (error && !launchData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-2xl mx-auto px-4 py-12">
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <XCircle className="h-16 w-16 text-destructive" />
              <h2 className="text-xl font-semibold">Invalid Request</h2>
              <p className="text-muted-foreground text-center max-w-md">{error}</p>
              <Button variant="outline" onClick={() => navigate("/agents")}>
                View Agents
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-12">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Sign Token Launch</CardTitle>
            <CardDescription>
              Connect your Phantom wallet to sign and broadcast the token creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Token Preview */}
            {launchData && (
              <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{launchData.token.name}</h3>
                      <Badge variant="secondary">${launchData.token.symbol}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {launchData.token.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      <Badge variant="outline" className="font-mono">
                        Mint: {launchData.token.mint.slice(0, 8)}...
                      </Badge>
                      <Badge variant="outline" className="font-mono">
                        Wallet: {launchData.token.wallet.slice(0, 8)}...
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Connection */}
            {status === "idle" && (
              <div className="space-y-4">
                <Button 
                  onClick={connectWallet} 
                  className="w-full" 
                  size="lg"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Phantom Wallet
                </Button>
                
                {!phantom && (
                  <p className="text-sm text-center text-muted-foreground">
                    Don't have Phantom?{" "}
                    <a 
                      href="https://phantom.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Get it here
                    </a>
                  </p>
                )}
              </div>
            )}

            {status === "connecting" && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Connecting to Phantom...</p>
              </div>
            )}

            {(status === "connected" || status === "signing" || status === "broadcasting") && launchData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Wallet Connected</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </div>

                {walletAddress !== launchData.token.wallet && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-600 dark:text-yellow-400">
                        Wrong Wallet
                      </p>
                      <p className="text-muted-foreground">
                        Please connect the wallet registered with this agent:
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                        {launchData.token.wallet}
                      </code>
                    </div>
                  </div>
                )}

                {walletAddress === launchData.token.wallet && (
                  <Button 
                    onClick={signAndBroadcast}
                    className="w-full"
                    size="lg"
                    disabled={status === "signing" || status === "broadcasting"}
                  >
                    {status === "signing" ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing Transaction...
                      </>
                    ) : status === "broadcasting" ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Broadcasting to Solana...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-5 w-5" />
                        Sign & Launch Token
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {status === "success" && launchData && (
              <div className="flex flex-col items-center py-8 space-y-6">
                <div className="relative">
                  <CheckCircle className="h-20 w-20 text-green-500" />
                  <span className="absolute -bottom-2 -right-2 text-3xl">🚀</span>
                </div>
                
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-green-500">Token Launched!</h2>
                  <p className="text-muted-foreground mt-2">
                    ${launchData.token.symbol} is now live on pump.fun
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Mint Address</p>
                    <code className="text-xs font-mono break-all">{launchData.token.mint}</code>
                  </div>
                  
                  {txSignature && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Transaction</p>
                      <code className="text-xs font-mono break-all">{txSignature}</code>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`https://pump.fun/coin/${launchData.token.mint}`, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on pump.fun
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => navigate("/feed")}
                  >
                    Go to Feed
                  </Button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <XCircle className="h-16 w-16 text-destructive" />
                <div className="text-center">
                  <h2 className="text-xl font-semibold">Transaction Failed</h2>
                  <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStatus("connected")}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/agents")}>
                    View Agents
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SignToken;
