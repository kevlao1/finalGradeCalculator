import { test, expect } from "@playwright/test";

test("user can register, log in, create a course, add grade data, and save", async ({ page }) => {
  const username = `e2e_user_${Date.now()}`;
  const password = "Aa1!aaaaa";
  const courseName = `Math 33B ${Date.now()}`;

  await page.goto("http://localhost:3000/finalGradeCalculator", {
    waitUntil: "networkidle",
  });

  // Sign up
  const signupSection = page.locator(".login-page").nth(1);

  await signupSection.getByPlaceholder("Create Username").fill(username);
  await signupSection.getByPlaceholder("Create Password").fill(password);
  await signupSection.getByPlaceholder("Confirm Password").fill(password);
  await signupSection.getByRole("button", { name: "Sign Up" }).click();

  await expect(page.getByText("Account created successfully!")).toBeVisible({
    timeout: 10000,
  });

  // Reload login page fresh
  await page.goto("http://localhost:3000/finalGradeCalculator", {
    waitUntil: "networkidle",
  });

  // Log in
  const loginSection = page.locator(".login-page").first();

  await loginSection.getByPlaceholder("Username").fill(username);
  await loginSection.getByPlaceholder("Password").fill(password);
  await loginSection.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/calculator/, { timeout: 10000 });
  await expect(page.getByText("Grade Calculator")).toBeVisible();

  // Course name
  await page
    .getByPlaceholder("Enter Course Name (e.g., Physics 101)")
    .fill(courseName);

  // Add category: Final - 50%
  await page.getByPlaceholder("Category name").fill("Final");
  await page.getByPlaceholder("Weight (%)").fill("50");
  await page.getByRole("button", { name: /^Add Category$/ }).click();

  const assignmentForm = page.locator("form.section1");

  await expect(assignmentForm.locator("select")).toContainText("Final", {
    timeout: 10000,
  });

  // Add assignment: Final_1, Final, 50/100
  await assignmentForm.locator('input[type="text"]').fill("Final_1");
  await assignmentForm.locator("select").selectOption({ label: "Final" });
  await expect(assignmentForm.locator("select")).toHaveValue("Final");

  const numberInputs = assignmentForm.locator('input[type="number"]');
  await numberInputs.nth(0).fill("50");
  await numberInputs.nth(1).fill("100");

  await assignmentForm.getByRole("button", { name: /^Add$/ }).click();

  // Check assignment row
  const assignmentRow = page.locator(".section2 ul").filter({
    hasText: "Final_1",
  });

  await expect(assignmentRow).toBeVisible({ timeout: 10000 });
  await expect(assignmentRow).toContainText("Final_1");
  await expect(assignmentRow).toContainText("Final");
  await expect(assignmentRow).toContainText("50.0");
  await expect(assignmentRow).toContainText("100.0");

  /* Frontend grade
  await expect(page.getByText(/Frontend grade:\s*50\.00/)).toBeVisible({
    timeout: 10000,
  }); */

  // Save course locally
  await page.getByRole("button", { name: "Save Course" }).click();

  await expect(page.getByText(`Saved ${courseName}!`)).toBeVisible({
    timeout: 10000,
  });

  // Save dashboard to database
  const dialogPromise = page.waitForEvent("dialog");

  await page
    .getByRole("button", { name: "Save Dashboard to Database" })
    .click();

  const dialog = await dialogPromise;

  console.log("Dialog message:", dialog.message());

  expect(dialog.message()).toMatch(
    /Grades uploaded successfully|Grades saved|success/i
  );

  await dialog.accept();
});