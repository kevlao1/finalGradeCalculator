import { test, expect } from "@playwright/test";

test("user can sign up and log in", async ({ page }) => {
  const username = `testuser_${Date.now()}`;
  const password = "Aa1!aaaa";

  await page.goto("http://localhost:3000/finalGradeCalculator", {
    waitUntil: "networkidle",
  });

  console.log("Current URL:", page.url());

  const placeholders = await page.locator("input").evaluateAll(inputs =>
    inputs.map(input => input.placeholder)
  );

  console.log("All placeholders:", placeholders);

  await page.screenshot({ path: "debug-page.png", fullPage: true });

  await expect(page.getByText("New? Sign up here!")).toBeVisible();

  await page.locator('input[placeholder="Create Username"]').fill(username);
  await page.locator('input[placeholder="Create Password"]').fill(password);
  await page.locator('input[placeholder="Confirm Password"]').fill(password);

  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page.getByText("Account created successfully!")).toBeVisible({
    timeout: 10000,
  });
});