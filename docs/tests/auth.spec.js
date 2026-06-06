import { test, expect } from "@playwright/test";

test("user can register, log in, create a course, add grade data, and save", async ({ page }) => {
  const username = `testuser_${Date.now()}`;
  const password = "Aa1!aaaa";

  await page.goto("http://localhost:3000/finalGradeCalculator", {
    waitUntil: "networkidle",
  });

  await expect(page.getByText("Welcome Back!")).toBeVisible();

  await page.getByText("Sign up here").click();
  await expect(page.getByText("Create Account")).toBeVisible();

  await page.getByPlaceholder("Create Username").fill(username);
  await page.getByPlaceholder("Create Password").fill(password);
  await page.getByPlaceholder("Confirm Password").fill(password);

  await page.getByRole("button", { name: "Sign Up" }).click();

  await page.waitForURL("**/calculator", { timeout: 15000 });

  await expect(page.getByText(/^Hi, /)).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();
  await expect(page.getByText("Grade Calculator")).toBeVisible();

  await page.getByPlaceholder("Enter Course Name (e.g., Physics 101)").fill("TEST 101");

  await page.getByPlaceholder("Category name").fill("Homework");
  await page.getByPlaceholder("Weight (%)").fill("50");
  await page.getByRole("button", { name: "Add Category" }).click();

  await expect(page.locator("ul li").filter({ hasText: "Homework" })).toBeVisible();
});