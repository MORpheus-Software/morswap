# Testing Instructions

Welcome to the **MorSwap** testing page. Follow these instructions to test the swap functionality:

---

Thank you so much for testing! Please note that although this is a testing site, I have done everything I can to ensure you are unable to connect to any Main networks. **Please take a moment to ensure you are using the Arbitrum Sepolia network.** You can check this by clicking the network name at the top of the page.

While this is a testing site, please be aware that there are still risks involved with the loss of testnet funds. **Please double-check every transaction** through MetaMask and the browser console.

---

### Steps to Test MorSwap:

1. **Connect Your Wallet:**
   - Click the **"Connect Wallet"** button on the top right corner of the page.
   - Ensure you have some testnet tokens like **MOR** and **ETH** in your wallet.
   - If you don't, **saMOR** can be found at [MorFaucet.xyz](http://MorFaucet.xyz), and **saETH** can be found at [faucets.chain.link/sepolia](https://faucets.chain.link/sepolia). *(This is my favorite faucet.)*

2. **Wrap ETH to WETH:**
   - Before swapping, you **must first wrap your ETH** into the mockWETH I created.
   - Use the **Wrap** and **Unwrap** buttons on the MorSwap Testing Instructions page.
     - This will wrap/unwrap any desired amount of ETH/WETH.
     - Uniswap will eventually handle this through **Multi-Hop Swaps**, which I plan to incorporate soon.
   
   - **mockWETH Address**:  
     `0x9F220B916edDcD745F9547f2D5cd5D06F40d1B6E`  
     *Please add this token to your wallet.*

3. **Liquidity Warning:**
   - **Due to low liquidity**, please try swapping small amounts, such as:
     - `0.0001 MOR`
     - `0.000001 WETH`
   - If you'd like to help by donating funds to the pool:
     - After wrapping some ETH on the testing page, click **"Add Liquidity"**. This will add a fixed **1000 MOR : 1 WETH** ratio to the pool.

4. **Perform a Swap:**
   - Enter the amount you want to swap in the top input field.
   - Click the **"Swap"** button to execute the swap.
   - Review the transaction and sign via MetaMask.
   - Confirm the transaction in your wallet.
   - Wait for the transaction to process and check your wallet for the swapped tokens.

---

### Troubleshooting:

If you encounter any issues or have questions, please submit them via the **GitHub Issues** section.

---

Thank you for testing MorSwap! Your feedback helps improve the project.
