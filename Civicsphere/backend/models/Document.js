import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a document title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or storage path is required'],
    },
    fileType: {
      type: String,
      default: 'application/pdf',
    },
    fileSize: {
      type: Number,
      default: 0, // Size in bytes
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UploadedBy user ID is required'],
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['UPLOADED', 'PROCESSING', 'READY', 'FAILED'],
        message: '{VALUE} is not a valid document status. Allowed: UPLOADED, PROCESSING, READY, FAILED',
      },
      default: 'UPLOADED',
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Legal Evidence',
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;
