import { BrowserProvider, formatEther, parseEther, JsonRpcSigner } from 'ethers';

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
}

class Web3Service {
  private provider: BrowserProvider | null = null;

  constructor() {
    if ((window as any).ethereum) {
      this.provider = new BrowserProvider((window as any).ethereum);
    }
  }

  async connectWallet(): Promise<WalletState> {
    if (!this.provider) {
      throw new Error("No crypto wallet found. Please install MetaMask.");
    }

    try {
      await this.provider.send("eth_requestAccounts", []);
      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true
      };
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  async getSigner(): Promise<JsonRpcSigner> {
    if (!this.provider) throw new Error("Provider not initialized");
    return await this.provider.getSigner();
  }

  // Simulates a smart contract deposit by sending a 0 ETH transaction to self with data payload
  // This verifies the user has a working wallet and allows them to approve a transaction
  async simulateDepositTransaction(amount: number, asset: string): Promise<string> {
    try {
      const signer = await this.getSigner();
      const address = await signer.getAddress();

      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(`ReToken Deposit: ${amount} ${asset}`);
      const hexData = Array.from(dataBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      // Create a transaction that looks like a contract interaction
      const tx = await signer.sendTransaction({
        to: address, // Send to self to keep funds safe
        value: parseEther("0"), // 0 ETH
        data: "0x" + hexData
      });

      console.log("Transaction sent:", tx.hash);
      // Wait for at least one confirmation (optional, for UI responsiveness we can return hash immediately)
      // await tx.wait(); 
      return tx.hash;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }

  shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const web3Service = new Web3Service();