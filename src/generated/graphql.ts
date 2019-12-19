type Maybe<T> = T | null;
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
  DateTime: Date,
  Upload: any,
};


export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

export type Commands = {
  _?: Maybe<Scalars['Boolean']>,
  UserSignIn: Scalars['String'],
  UserSignUp: User,
};


export type CommandsUserSignInArgs = {
  email: Scalars['String'],
  password: Scalars['String']
};


export type CommandsUserSignUpArgs = {
  email: Scalars['String'],
  password: Scalars['String']
};


export type Document = {
  id: Scalars['ID'],
  createdAt: Scalars['DateTime'],
  updatedAt: Scalars['DateTime'],
};

export type Page = {
  total: Scalars['Int'],
  limit: Scalars['Int'],
  skip: Scalars['Int'],
  data: Array<Document>,
};

export type Queries = {
  _?: Maybe<Scalars['Boolean']>,
  UserFind: UserPage,
};

export type Subscriptions = {
  _?: Maybe<Scalars['Boolean']>,
};


export type User = Document & {
  id: Scalars['ID'],
  createdAt: Scalars['DateTime'],
  updatedAt: Scalars['DateTime'],
  email: Scalars['String'],
  password: Scalars['String'],
  role: UserRole,
};

export type UserPage = Page & {
  total: Scalars['Int'],
  limit: Scalars['Int'],
  skip: Scalars['Int'],
  data: Array<User>,
};

export enum UserRole {
  Guest = 'Guest',
  Member = 'Member',
  Admin = 'Admin'
}

import { ExHorseContext } from '../types';

import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';

export type ArrayOrIterable<T> = Array<T> | Iterable<T>;



export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface ISubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, TParent, TContext, TArgs>;
}

export type SubscriptionResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => ISubscriptionResolverObject<TResult, TParent, TContext, TArgs>)
  | ISubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export type CacheControlDirectiveResolver<Result, Parent, Context = ExHorseContext, Args = {   maxAge?: Maybe<Maybe<Scalars['Int']>>,
  scope?: Maybe<Maybe<CacheControlScope>> }> = DirectiveResolverFn<Result, Parent, Context, Args>;

export type CommandsResolvers<Context = ExHorseContext, ParentType = Commands> = {
  _?: Resolver<Maybe<Scalars['Boolean']>, ParentType, Context>,
  UserSignIn?: Resolver<Scalars['String'], ParentType, Context, CommandsUserSignInArgs>,
  UserSignUp?: Resolver<User, ParentType, Context, CommandsUserSignUpArgs>,
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<Scalars['DateTime'], any> {
  name: 'DateTime'
}

export type DocumentResolvers<Context = ExHorseContext, ParentType = Document> = {
  __resolveType: TypeResolveFn<'User'>,
  id?: Resolver<Scalars['ID'], ParentType, Context>,
  createdAt?: Resolver<Scalars['DateTime'], ParentType, Context>,
  updatedAt?: Resolver<Scalars['DateTime'], ParentType, Context>,
};

export type PageResolvers<Context = ExHorseContext, ParentType = Page> = {
  __resolveType: TypeResolveFn<'UserPage'>,
  total?: Resolver<Scalars['Int'], ParentType, Context>,
  limit?: Resolver<Scalars['Int'], ParentType, Context>,
  skip?: Resolver<Scalars['Int'], ParentType, Context>,
  data?: Resolver<ArrayOrIterable<Document>, ParentType, Context>,
};

export type QueriesResolvers<Context = ExHorseContext, ParentType = Queries> = {
  _?: Resolver<Maybe<Scalars['Boolean']>, ParentType, Context>,
  UserFind?: Resolver<UserPage, ParentType, Context>,
};

export type SubscriptionsResolvers<Context = ExHorseContext, ParentType = Subscriptions> = {
  _?: SubscriptionResolver<Maybe<Scalars['Boolean']>, ParentType, Context>,
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<Scalars['Upload'], any> {
  name: 'Upload'
}

export type UserResolvers<Context = ExHorseContext, ParentType = User> = {
  id?: Resolver<Scalars['ID'], ParentType, Context>,
  createdAt?: Resolver<Scalars['DateTime'], ParentType, Context>,
  updatedAt?: Resolver<Scalars['DateTime'], ParentType, Context>,
  email?: Resolver<Scalars['String'], ParentType, Context>,
  password?: Resolver<Scalars['String'], ParentType, Context>,
  role?: Resolver<UserRole, ParentType, Context>,
};

export type UserPageResolvers<Context = ExHorseContext, ParentType = UserPage> = {
  total?: Resolver<Scalars['Int'], ParentType, Context>,
  limit?: Resolver<Scalars['Int'], ParentType, Context>,
  skip?: Resolver<Scalars['Int'], ParentType, Context>,
  data?: Resolver<ArrayOrIterable<User>, ParentType, Context>,
};

export type IResolvers<Context = ExHorseContext> = {
  Commands?: CommandsResolvers<Context>,
  DateTime?: GraphQLScalarType,
  Document?: DocumentResolvers,
  Page?: PageResolvers,
  Queries?: QueriesResolvers<Context>,
  Subscriptions?: SubscriptionsResolvers<Context>,
  Upload?: GraphQLScalarType,
  User?: UserResolvers<Context>,
  UserPage?: UserPageResolvers<Context>,
};

export type IDirectiveResolvers<Context = ExHorseContext> = {
  cacheControl?: CacheControlDirectiveResolver<any, any, Context>,
};
