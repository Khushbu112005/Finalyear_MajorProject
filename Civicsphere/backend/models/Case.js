import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a case title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a case description'],
      trim: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A case must belong to a citizen'],
    },
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    category: {
      type: String,
      enum: [
        'Civil Rights',
        'Property & Land',
        'Family & Domestic',
        'Consumer Protection',
        'Labor & Employment',
        'Criminal Defense',
        'Corporate & Business',
        'Tax & Financial',
        'Constitutional Law',
        'General / Other',
      ],
      default: 'General / Other',
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'IN_PROGRESS', 'CLOSED'],
        message: '{VALUE} is not a valid status. Allowed: OPEN, IN_PROGRESS, CLOSED',
      },
      default: 'OPEN',
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH'],
        message: '{VALUE} is not a valid priority. Allowed: LOW, MEDIUM, HIGH',
      },
      default: 'MEDIUM',
    },
    deadline: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      default: '',
    },
    courtReference: {
      type: String,
      default: '',
    },
    lawyerNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Case = mongoose.model('Case', caseSchema);

export default Case;
