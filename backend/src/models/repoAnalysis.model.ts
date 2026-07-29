import mongoose, { Schema } from "mongoose";

/**
 * M1
 */
export interface IFolderEntry {
  path: string;
  purpose: string;
  type: "entry" | "logic" | "config" | "utility" | "test" | "other";
}

/**
 * M2
 */
export interface IEntryPoint {
  file: string;
  executionFlow: string[];
  description: string;
}

/**
 * M3
 */
export interface IDependencyNode {
  file: string;
  imports: string[];
  importedBy: string[];
}
export interface IDependencyMap {
  formattedAscii?: string;
  graph: IDependencyNode[];
}

export interface IAnalysisResult {
  m1: IFolderEntry[];
  m2: IEntryPoint;
  m3: IDependencyMap;
}

/**Document */
export interface IRepoAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  repoUrl: string;
  repoUrlHash: string;
  jobId: string;
  status: "waiting" | "active" | "completed" | "failed";
  result: IAnalysisResult | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

const FolderEntrySchema = new Schema<IFolderEntry>(
  {
    path: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["entry", "logic", "config", "utility", "test", "other"],
      default: "other",
    },
  },
  { _id: false },
);

const EntryPointSchema = new Schema<IEntryPoint>(
  {
    file: {
      type: String,
      required: true,
    },
    executionFlow: [{ type: String }],
    description: {
      type: String,
    },
  },
  { _id: false },
);

const DependencyNodeSchema = new Schema<IDependencyNode>(
  {
    file: {
      type: String,
      required: true,
    },
    imports: [{ type: String }],
    importedBy: [{ type: String }],
  },
  { _id: false },
);

const repoAnalysischema = new Schema<IRepoAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    repoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    repoUrlHash: {
      type: String,
      required: true,
      index: true,
      unique: false,
    },
    jobId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "failed"],
      default: "waiting",
      index: true,
    },
    result: {
      m1: [FolderEntrySchema],
      m2: EntryPointSchema,
      m3: [DependencyNodeSchema],
    },
    error: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

repoAnalysischema.index({
    userId: 1, createdAt: -1
});

repoAnalysischema.index({
    repoUrlHash: 1, status: 1
})

const repoAnalysisModel = mongoose.model<IRepoAnalysis>("RepoAnalysis", repoAnalysischema);

export default repoAnalysisModel;
