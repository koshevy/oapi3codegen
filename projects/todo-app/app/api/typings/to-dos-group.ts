/* tslint:disable */
import { ToDosGroupBlank } from './to-dos-group-blank';
import { ToDosGroupExtendedData } from './to-dos-group-extended-data';

export type ToDosGroup = ToDosGroupBlank & // Data needed for group creation
  ToDosGroupExtendedData; // Extended data has to be obtained after first save
