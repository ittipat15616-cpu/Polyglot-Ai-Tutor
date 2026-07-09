export function getFirebaseStorageUrl(localPath: string): string {
    const bucket = "polyglot-ai-tuto.firebasestorage.app";
    // Clean path, remove leading slash if any
    const cleanPath = localPath.startsWith('/') ? localPath.substring(1) : localPath;
    
    // Encode the entire path so that slashes become %2F, as required by Firebase Storage REST API
    const encodedPath = encodeURIComponent(cleanPath);
    
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
}
