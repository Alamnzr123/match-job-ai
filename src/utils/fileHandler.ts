import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const fsPromises = {
  writeFile: promisify(fs.writeFile),
  readFile: promisify(fs.readFile),
  unlink: promisify(fs.unlink),
};

const allowedFileTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const validateFileType = (fileType: string): boolean => {
  return allowedFileTypes.includes(fileType);
};

export const saveFile = async (file: Express.Multer.File, uploadDir: string): Promise<string> => {
  const filePath = path.join(uploadDir, file.originalname);
  await fsPromises.writeFile(filePath, file.buffer);
  return filePath;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  await fsPromises.unlink(filePath);
};

export const readFileContent = async (filePath: string): Promise<string> => {
  return await fsPromises.readFile(filePath, 'utf-8');
};