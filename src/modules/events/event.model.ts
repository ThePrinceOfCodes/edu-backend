import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { toJSON } from '../toJSON';
import { paginate } from '../paginate';
import { IEventDoc, IEventModel } from './events.interfaces';

const eventSchema = new mongoose.Schema<IEventDoc, IEventModel>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    allDay: {
      type: Boolean,
      default: true,
    },
    schoolBoard: {
      type: String,
      ref: 'SchoolBoard',
      default: null,
    },
    school: {
      type: String,
      ref: 'School',
      default: null,
    },
    color: {
      type: String,
      default: null,
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.plugin(toJSON);
eventSchema.plugin(paginate);

const EventModel = mongoose.model<IEventDoc, IEventModel>('Event', eventSchema);

export default EventModel;
