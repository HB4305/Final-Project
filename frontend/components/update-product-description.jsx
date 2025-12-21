import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * UpdateProductDescription Component
 * Allows seller to update product description after posting
 * API 3.2: PUT /api/products/:productId/description
 */
export default function UpdateProductDescription({ productId, currentDescription, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(currentDescription || '');
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/api/products/${productId}/description`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          metadata
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Description updated successfully!');
        setIsEditing(false);
        if (onUpdate) {
          onUpdate(result.data.product);
        }
      } else {
        setError(result.message || 'Failed to update description');
      }
    } catch (err) {
      console.error('Error updating description:', err);
      setError('An error occurred while updating description');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Description</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Edit3 className="w-4 h-4" />
            Edit Description
          </button>
        </div>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: currentDescription }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Product Description</h3>
        <button
          onClick={() => {
            setIsEditing(false);
            setDescription(currentDescription);
            setError('');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description * (minimum 10 characters)
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <ReactQuill
              value={description}
              onChange={setDescription}
              className="bg-white"
              placeholder="Update your product description..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['clean']
                ]
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
