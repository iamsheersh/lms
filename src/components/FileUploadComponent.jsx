import React, { useState } from 'react';
import { Upload, X, FileText, Video, PlayCircle } from 'lucide-react';

const FileUploadComponent = ({ onFileUpload, topicId, onClose }) => {
  const [file, setFile] = useState(null);
  const [materialName, setMaterialName] = useState('');
  const [materialType, setMaterialType] = useState('pdf');
  const [duration, setDuration] = useState('');
  const [pages, setPages] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-detect file type
      if (selectedFile.type.includes('video')) {
        setMaterialType('video');
      } else if (selectedFile.type.includes('pdf')) {
        setMaterialType('pdf');
      }
      // Set default name from file
      setMaterialName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file || !materialName) {
      setError('Please select a file and enter a material name');
      return;
    }

    setUploading(true);

    try {
      // Create a mock URL for now (in production, upload to Firebase Storage)
      const fileUrl = URL.createObjectURL(file);
      
      const materialData = {
        topicId,
        name: materialName,
        type: materialType,
        url: fileUrl,
        duration: duration || undefined,
        pages: pages || undefined,
        createdAt: new Date()
      };

      await onFileUpload(materialData);
      
      // Reset form
      setFile(null);
      setMaterialName('');
      setMaterialType('pdf');
      setDuration('');
      setPages('');
      
      onClose();
    } catch (error) {
      setError('Failed to upload material. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-8 h-8 text-slate-400" />;
    
    if (file.type.includes('video')) {
      return <Video className="w-8 h-8 text-red-500" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    } else {
      return <PlayCircle className="w-8 h-8 text-green-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Upload Study Material</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select File
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.mp4,.avi,.mov,.doc,.docx"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {getFileIcon()}
                  <p className="mt-2 text-sm text-slate-600">
                    {file ? file.name : 'Click to browse or drag and drop'}
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF, Video, Document files (Max 50MB)
                  </p>
                </label>
              </div>
            </div>

            {/* Material Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Material Name
              </label>
              <input
                type="text"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter material name"
                required
              />
            </div>

            {/* Material Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Material Type
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pdf">PDF Document</option>
                <option value="video">Video</option>
                <option value="simulation">Simulation</option>
                <option value="test">Test</option>
              </select>
            </div>

            {/* Additional Fields based on type */}
            {materialType === 'video' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 15 min"
                />
              </div>
            )}

            {materialType === 'pdf' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Pages
                </label>
                <input
                  type="number"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 25"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Material'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FileUploadComponent;
