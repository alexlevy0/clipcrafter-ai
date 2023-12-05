/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateBlog = /* GraphQL */ `subscription OnCreateBlog {
  onCreateBlog {
    id
    name
    posts {
      nextToken
      startedAt
      __typename
    }
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBlogSubscriptionVariables,
  APITypes.OnCreateBlogSubscription
>;
export const onUpdateBlog = /* GraphQL */ `subscription OnUpdateBlog {
  onUpdateBlog {
    id
    name
    posts {
      nextToken
      startedAt
      __typename
    }
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBlogSubscriptionVariables,
  APITypes.OnUpdateBlogSubscription
>;
export const onDeleteBlog = /* GraphQL */ `subscription OnDeleteBlog {
  onDeleteBlog {
    id
    name
    posts {
      nextToken
      startedAt
      __typename
    }
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBlogSubscriptionVariables,
  APITypes.OnDeleteBlogSubscription
>;
export const onCreatePost = /* GraphQL */ `subscription OnCreatePost {
  onCreatePost {
    id
    title
    blogID
    blog {
      id
      name
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
    comments {
      nextToken
      startedAt
      __typename
    }
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreatePostSubscriptionVariables,
  APITypes.OnCreatePostSubscription
>;
export const onUpdatePost = /* GraphQL */ `subscription OnUpdatePost {
  onUpdatePost {
    id
    title
    blogID
    blog {
      id
      name
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
    comments {
      nextToken
      startedAt
      __typename
    }
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdatePostSubscriptionVariables,
  APITypes.OnUpdatePostSubscription
>;
export const onDeletePost = /* GraphQL */ `subscription OnDeletePost {
  onDeletePost {
    id
    title
    blogID
    blog {
      id
      name
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
    comments {
      nextToken
      startedAt
      __typename
    }
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeletePostSubscriptionVariables,
  APITypes.OnDeletePostSubscription
>;
export const onCreateComment = /* GraphQL */ `subscription OnCreateComment {
  onCreateComment {
    id
    postID
    post {
      id
      title
      blogID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
    content
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateCommentSubscriptionVariables,
  APITypes.OnCreateCommentSubscription
>;
export const onUpdateComment = /* GraphQL */ `subscription OnUpdateComment {
  onUpdateComment {
    id
    postID
    post {
      id
      title
      blogID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
    content
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateCommentSubscriptionVariables,
  APITypes.OnUpdateCommentSubscription
>;
export const onDeleteComment = /* GraphQL */ `subscription OnDeleteComment {
  onDeleteComment {
    id
    postID
    post {
      id
      title
      blogID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
    content
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteCommentSubscriptionVariables,
  APITypes.OnDeleteCommentSubscription
>;
