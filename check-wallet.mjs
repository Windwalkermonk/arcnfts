import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const client = initiateDeveloperControlledWalletsClient({
  apiKey: "TEST_API_KEY:41ba6ec84b77a1d435d904268dc8372b:303305ac3ff0dd8754af701fd7e0b195",
  entitySecret: "1a2ce69fe88cb1fd587559fcfeb0a8904982c05aee1c356b8c8d862e14e0abbf",
});

try {
  const wallets = await client.listWallets({});
  console.log("Wallets:", JSON.stringify(wallets.data, null, 2));
} catch (err) {
  console.error("Error:", err.response?.data || err.message || err);
}
