# Firebase Security Rules Guide

## Current Issue

You're encountering the following error when trying to add projects to your Firestore database:

```
Error adding dummy projects: FirebaseError: Missing or insufficient permissions.
```

This error occurs because your Firebase security rules are restricting write access to your database. By default, Firebase security rules are set to deny all reads and writes to protect your data.

## How to Fix the Issue

You need to update your Firebase security rules to allow write operations to your projects collection. Here's how to do it:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "my-portfolio-website-92e1c"
3. In the left sidebar, click on "Firestore Database"
4. Click on the "Rules" tab
5. Update your security rules to allow read/write access

### Option 1: Allow read/write for authenticated users only (Recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

This will allow anyone to read your data, but only authenticated users can write to the database.

### Option 2: Allow read/write for everyone (For development only)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write;
    }
  }
}
```

**Warning**: This option allows anyone to read and write to your database. Only use this for development purposes and change it to more restrictive rules before going to production.

### Option 3: Specific collection rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read;
      allow write: if request.auth != null;
    }
    match /skills/{skillId} {
      allow read;
      allow write: if request.auth != null;
    }
    match /education/{educationId} {
      allow read;
      allow write: if request.auth != null;
    }
    match /{document=**} {
      allow read;
      allow write: if false;
    }
  }
}
```

This option provides more granular control by specifying rules for each collection.

## After Updating Rules

After updating your Firebase security rules:

1. Wait a few minutes for the changes to propagate
2. Return to your portfolio website
3. Try adding the dummy projects again using the add-projects.html page

## Authentication

If you're using Option 1 or Option 3, you'll need to be logged in to add projects. Make sure you're logged in through the login page before attempting to add projects.

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Common Firebase Security Rules Patterns](https://firebase.google.com/docs/rules/patterns)
- [Testing Firebase Security Rules](https://firebase.google.com/docs/rules/unit-tests)