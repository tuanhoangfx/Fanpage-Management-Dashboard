import { GRAPH_API_BASE_URL } from '../constants';
import type { ManagedPage, Page } from '../types';

async function fetchGraphAPI<T>(endpoint: string, token: string): Promise<T> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${GRAPH_API_BASE_URL}${endpoint}${separator}access_token=${token}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch data from Facebook API');
    }
    return await response.json() as T;
  } catch (error) {
    console.error('Facebook Graph API Error (GET):', error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('An unknown error occurred during API request.');
  }
}

async function postGraphAPI<T>(endpoint: string, token: string, formData: FormData): Promise<T> {
    const url = `${GRAPH_API_BASE_URL}${endpoint}`;
    formData.append('access_token', token);
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error?.message || 'Failed to post data to Facebook API');
        }
        return responseData as T;
    } catch (error) {
        console.error('Facebook Graph API Error (POST):', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('An unknown error occurred during API POST request.');
    }
}

async function deleteGraphAPI<T>(endpoint: string, token: string): Promise<T> {
    const url = `${GRAPH_API_BASE_URL}${endpoint}?access_token=${token}`;
    try {
        const response = await fetch(url, { method: 'DELETE' });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error?.message || 'Failed to delete data via Facebook API');
        }
        return responseData as T;
    } catch (error) {
        console.error('Facebook Graph API Error (DELETE):', error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error('An unknown error occurred during API DELETE request.');
    }
}


export async function getTokenInfo(token: string): Promise<{user: {name: string, id: string, picture: { data: { url: string } } }, pageCount: number}> {
    if (!token) {
        throw new Error('Access Token is not provided.');
    }
    const [user, accounts] = await Promise.all([
        fetchGraphAPI<{name: string, id: string, picture: { data: { url: string } } }>('/me?fields=id,name,picture.type(square)', token),
        fetchGraphAPI<{ data: {id: string}[] }>(`/me/accounts?fields=id`, token)
    ]);
    return { user, pageCount: accounts.data?.length || 0 };
}


export async function getPagesData(accessToken: string): Promise<Page[]> {
  if (!accessToken) {
    throw new Error('Access Token is not provided.');
  }
  // 1. Get the list of pages managed by the user
  const managedPagesResponse = await fetchGraphAPI<{ data: ManagedPage[] }>(`/me/accounts?fields=id,name,access_token`, accessToken);
  
  if (!managedPagesResponse.data || managedPagesResponse.data.length === 0) {
    // This is not an error, the user might just not manage any pages.
    return [];
  }
  
  // 2. Prepare to fetch all required data for each page in parallel
  const postFields = 'message,created_time,permalink_url,attachments{media{image,source},type,subattachments{media{image,source},type}},insights.metric(post_reactions_by_type_total,post_impressions_unique,post_clicks_by_type).period(lifetime)';
  const fields = [
    'id',
    'name',
    'about',
    'followers_count',
    'cover{source}',
    'picture.type(large){url}',
    'link',
    'username',
    'category',
    'verification_status',
    'website',
    'location',
    'phone',
    'emails',
    // Use published_posts edge for both post data and total count for consistency.
    // .summary(true) provides the total_count. .limit(100) gets the most recent posts.
    `published_posts.summary(true).limit(100){${postFields}}`
  ].join(',');

  const pagePromises = managedPagesResponse.data.map(page => {
    const pageAccessToken = page.access_token;
    return fetchGraphAPI<Page>(`/${page.id}?fields=${fields}`, pageAccessToken).then(pageData => ({
        ...pageData,
        access_token: page.access_token 
    }));
  });

  const pagesData = await Promise.all(pagePromises);
  
  return pagesData;
}


export async function updatePageDetails(pageId: string, pageToken: string, details: { name?: string; about?: string; coverFile?: File; pictureFile?: File }): Promise<{ success: boolean }> {
    const { name, about, coverFile, pictureFile } = details;
    let coverPhotoId: string | null = null;

    if (coverFile) {
        const photoFormData = new FormData();
        photoFormData.append('source', coverFile);
        photoFormData.append('published', 'false');
        photoFormData.append('temporary', 'true');
        
        const photoUploadResponse = await postGraphAPI<{ id: string }>(`/${pageId}/photos`, pageToken, photoFormData);
        coverPhotoId = photoUploadResponse.id;
    }

    if (pictureFile) {
        const pictureFormData = new FormData();
        pictureFormData.append('source', pictureFile);
        await postGraphAPI<{ success: boolean }>(`/${pageId}/picture`, pageToken, pictureFormData);
    }

    const pageUpdateFormData = new FormData();
    if (name) {
        pageUpdateFormData.append('name', name);
    }
    if (about) {
        pageUpdateFormData.append('about', about);
    }
    if (coverPhotoId) {
        pageUpdateFormData.append('cover', coverPhotoId);
    }
    
    if (name || about || coverPhotoId) {
        await postGraphAPI<{ success: boolean }>(`/${pageId}`, pageToken, pageUpdateFormData);
    }

    return { success: true };
}

// --- Role Management ---
export type PageRole = 'ADMIN' | 'EDITOR' | 'MODERATOR' | 'ADVERTISER' | 'ANALYST';

export async function assignRoleToPage(pageId: string, pageToken: string, userId: string, role: PageRole): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('user', userId);
    formData.append('role', role);
    return postGraphAPI<{ success: boolean }>(`/${pageId}/roles`, pageToken, formData);
}


// --- Post Management ---
export async function updatePostMessage(postId: string, pageToken: string, message: string): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('message', message);
    return postGraphAPI<{ success: boolean }>(`/${postId}`, pageToken, formData);
}

export async function deletePost(postId: string, pageToken: string): Promise<{ success: boolean }> {
    return deleteGraphAPI<{ success: boolean }>(`/${postId}`, pageToken);
}

export type ReactionType = 'LIKE' | 'LOVE' | 'CARE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export async function postReaction(postId: string, pageToken: string, type: ReactionType): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('type', type);
    return postGraphAPI<{ success: boolean }>(`/${postId}/reactions`, pageToken, formData);
}

export async function postComment(postId: string, pageToken: string, message: string): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('message', message);
    return postGraphAPI<{ id: string }>(`/${postId}/comments`, pageToken, formData);
}


// --- Uploader Functions ---

export async function fetchImageAsFile(imageUrl: string, fileName: string): Promise<File> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image. Server responded with status: ${response.status}`);
    }
    const blob = await response.blob();
     if (!blob.type.startsWith('image/')) {
      throw new Error('The fetched file is not an image.');
    }
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.error("Error fetching image from URL:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Could not fetch image from URL. ${message}. This may be due to a CORS policy on the remote server or an invalid URL.`);
  }
}

export async function postTextOnly(pageId: string, pageToken: string, message: string, scheduledPublishTime?: number): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('message', message);
    if (scheduledPublishTime) {
        formData.append('published', 'false');
        formData.append('scheduled_publish_time', scheduledPublishTime.toString());
    }
    return postGraphAPI<{ id: string }>(`/${pageId}/feed`, pageToken, formData);
}

export async function postWithLink(pageId: string, pageToken: string, message: string, link: string, scheduledPublishTime?: number): Promise<{ id: string }> {
    const formData = new FormData();
    if (message) {
        formData.append('message', message);
    }
    formData.append('link', link);
    if (scheduledPublishTime) {
        formData.append('published', 'false');
        formData.append('scheduled_publish_time', scheduledPublishTime.toString());
    }
    return postGraphAPI<{ id: string }>(`/${pageId}/feed`, pageToken, formData);
}


export async function postSingleImage(pageId: string, pageToken: string, message: string, imageFile: File, scheduledPublishTime?: number): Promise<{ post_id: string }> {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('source', imageFile);
    if (scheduledPublishTime) {
        formData.append('published', 'false');
        formData.append('scheduled_publish_time', scheduledPublishTime.toString());
    }
    return postGraphAPI<{ id: string; post_id: string }>(`/${pageId}/photos`, pageToken, formData);
}

export async function postSingleVideo(pageId: string, pageToken: string, description: string, videoFile: File, scheduledPublishTime?: number): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('source', videoFile);
     if (scheduledPublishTime) {
        formData.append('published', 'false');
        formData.append('scheduled_publish_time', scheduledPublishTime.toString());
    }
    return postGraphAPI<{ id: string }>(`/${pageId}/videos`, pageToken, formData);
}

export async function postMultipleImages(pageId: string, pageToken: string, message: string, imageFiles: File[], scheduledPublishTime?: number): Promise<{ id: string }> {
    const unpublishedPhotoIds: string[] = [];
    
    const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('published', 'false');
        formData.append('source', file);
        const response = await postGraphAPI<{ id: string }>(`/${pageId}/photos`, pageToken, formData);
        unpublishedPhotoIds.push(response.id);
    });

    await Promise.all(uploadPromises);

    if (unpublishedPhotoIds.length !== imageFiles.length) {
        throw new Error('One or more images failed to upload.');
    }

    const feedFormData = new FormData();
    feedFormData.append('message', message);
    unpublishedPhotoIds.forEach((photoId, index) => {
        feedFormData.append(`attached_media[${index}]`, `{"media_fbid":"${photoId}"}`);
    });

    if (scheduledPublishTime) {
        feedFormData.append('published', 'false');
        feedFormData.append('scheduled_publish_time', scheduledPublishTime.toString());
    }
    
    return postGraphAPI<{ id: string }>(`/${pageId}/feed`, pageToken, feedFormData);
}