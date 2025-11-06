const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set");
}
console.log("Hello via Bun!");
export { PRIVATE_KEY };