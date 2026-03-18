# AdTruck Debug Context — 2026-03-17

## Bug Being Fixed
The login form test file was written for an email-based login form (the original template) but the app was changed to use username-based login — now all three non-trivial tests fail when you run `pnpm test`.

## File
/Users/praneeth/LoneStar_ERP/adtruck-driver-native/src/features/auth/components/login-form.test.tsx

## Lines
Lines 18–65 (all three non-trivial test cases)

## Root Cause
The project was built on the Obytes React Native Template, which ships with an email+password login form. The form was changed to username+password login (using Supabase RPC `get_auth_email_by_username`), but the test file was never updated to match. Every testID, error string, and field name in the tests still refers to the old email form.

## What the Fix Should Do
- Replace every occurrence of `email-input` testID with `username-input`
- Replace "Email is required" error text with "Username is required"
- Remove the third test entirely ("should display matching error when email is invalid") — there is no email field and no email format validation in the current schema
- In the fourth test ("should call LoginForm with correct values"), change the `email: 'youssef@gmail.com'` field name to `username: 'driver1'` (or any valid username string) in both the `user.type()` call and the `toHaveBeenCalledWith` assertion
- The schema validates: `username` must be min 1 char ("Username is required"), `password` must be min 6 chars ("Password must be at least 6 characters")

## Do Not Change
- The `form-title` testID check in the first test — that is correct and passes
- The `login-button` testID — that is correct in both component and test
- The `password-input` testID — that is correct in both component and test
- The `onSubmit` prop wiring or anything in `login-form.tsx` itself — only the test file needs changing

## How to Verify the Fix
Run `pnpm test src/features/auth/components/login-form.test.tsx` and confirm all tests pass with 0 failures.
