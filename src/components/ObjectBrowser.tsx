import { useState, useRef, useCallback } from 'react';
import type { S3Object, Bucket } from '../types';
import { formatFileSize, formatDate, getFileName, isImage, isTextFile } from '../utils/format';
import './ObjectBrowser.css';

interface ObjectBrowserProps {
  bucket: Bucket | null;
  objects: S3Object[];
  prefixes: string[];
  currentPath: string;
  loading: boolean;
  onNavigateTo: (path: string) => void;
  onNavigateUp: () => void;
  onUpload: (file: File, path: string) => Promise<void>;
  onDownload: (key: string) => Promise<Blob | null>;
  onDelete: (key: string) => Promise<void>;
  onSearch: (term: string) => Promise<S3Object[]>;
  onCreateFolder: (name: string) => Promise<void>;
  onRefresh: () => void;
}

export function ObjectBrowser({
  bucket,
  objects,
  prefixes,
  currentPath,
  loading,
  onNavigateTo,
  onNavigateUp,
  onUpload,
  onDownload,
  onDelete,
  onSearch,
  onCreateFolder,
  onRefresh,
}: ObjectBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<S3Object[] | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewObject, setPreviewObject] = useState<{ key: string; blob: Blob } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await onSearch(searchTerm);
    setSearchResults(results);
  }, [searchTerm, onSearch]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await onUpload(files[i], currentPath);
      }
    } catch {
      // Error handled by parent
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (key: string) => {
    const blob = await onDownload(key);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFileName(key);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePreview = async (key: string) => {
    const blob = await onDownload(key);
    if (blob) {
      setPreviewObject({ key, blob });
    }
  };

  const handleDelete = async (key: string) => {
    if (window.confirm(`Are you sure you want to delete "${getFileName(key)}"?`)) {
      await onDelete(key);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreateFolderModal(false);
  };

  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: bucket?.name || 'Root', path: '' }];
    let path = '';
    for (const part of parts) {
      path += `${part}/`;
      crumbs.push({ name: part, path });
    }
    return crumbs;
  };

  const displayObjects = searchResults !== null ? searchResults : objects;
  const displayPrefixes = searchResults !== null ? [] : prefixes;

  if (!bucket) {
    return (
      <div className="object-browser empty">
        <div className="empty-content">
          <h2>Welcome to S3 Browser</h2>
          <p>Select a bucket from the sidebar to browse objects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="object-browser">
      <div className="browser-toolbar">
        <div className="breadcrumbs">
          {getBreadcrumbs().map((crumb, index) => (
            <span key={crumb.path}>
              {index > 0 && <span className="separator">/</span>}
              <button
                className="crumb"
                onClick={() => onNavigateTo(crumb.path)}
                disabled={currentPath === crumb.path}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
        <div className="toolbar-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search objects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchTerm && (
              <button className="clear-search" onClick={handleClearSearch}>
                ✕
              </button>
            )}
            <button className="search-btn" onClick={handleSearch}>
              🔍
            </button>
          </div>
        </div>
      </div>

      <div className="browser-actions">
        {currentPath && (
          <button className="action-btn" onClick={onNavigateUp}>
            ↑ Up
          </button>
        )}
        <button className="action-btn" onClick={onRefresh} disabled={loading}>
          ↻ Refresh
        </button>
        <button className="action-btn" onClick={() => setShowCreateFolderModal(true)}>
          📁 New Folder
        </button>
        <button className="action-btn primary" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? '⏳ Uploading...' : '⬆ Upload'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          multiple
        />
      </div>

      <div className="objects-container">
        {loading ? (
          <div className="loading">Loading objects...</div>
        ) : displayPrefixes.length === 0 && displayObjects.length === 0 ? (
          <div className="empty-folder">
            <p>This folder is empty</p>
            <button onClick={handleUploadClick}>Upload files</button>
          </div>
        ) : (
          <table className="objects-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayPrefixes.map((prefix) => (
                <tr key={prefix} className="folder-row" onClick={() => onNavigateTo(prefix)}>
                  <td>
                    <span className="file-icon">📁</span>
                    <span className="file-name">{getFileName(prefix)}</span>
                  </td>
                  <td>-</td>
                  <td>-</td>
                  <td>
                    <button
                      className="table-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(prefix);
                      }}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
              {displayObjects
                .filter((obj) => {
                  // Filter out the current folder marker
                  const relativeName = obj.key.slice(currentPath.length);
                  return relativeName && !relativeName.endsWith('/');
                })
                .map((obj) => (
                  <tr key={obj.key}>
                    <td>
                      <span className="file-icon">{getFileIcon(obj.key)}</span>
                      <span className="file-name">{getFileName(obj.key)}</span>
                    </td>
                    <td>{formatFileSize(obj.size)}</td>
                    <td>{formatDate(obj.lastModified)}</td>
                    <td>
                      <div className="table-actions">
                        {(isImage(obj.key) || isTextFile(obj.key)) && (
                          <button
                            className="table-action"
                            onClick={() => handlePreview(obj.key)}
                            title="Preview"
                          >
                            👁
                          </button>
                        )}
                        <button
                          className="table-action"
                          onClick={() => handleDownload(obj.key)}
                          title="Download"
                        >
                          ⬇
                        </button>
                        <button
                          className="table-action delete"
                          onClick={() => handleDelete(obj.key)}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="modal-overlay" onClick={() => setShowCreateFolderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Folder</h3>
            <form onSubmit={handleCreateFolder}>
              <div className="form-group">
                <label htmlFor="folderName">Folder Name</label>
                <input
                  id="folderName"
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="my-folder"
                  required
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateFolderModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewObject && (
        <div className="modal-overlay" onClick={() => setPreviewObject(null)}>
          <div className="modal preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{getFileName(previewObject.key)}</h3>
              <button className="close-btn" onClick={() => setPreviewObject(null)}>
                ✕
              </button>
            </div>
            <div className="preview-content">
              <PreviewContent objectKey={previewObject.key} blob={previewObject.blob} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getFileIcon(key: string): string {
  if (isImage(key)) return '🖼';
  if (isTextFile(key)) return '📄';
  const ext = key.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return '📕';
  if (['zip', 'tar', 'gz', 'rar'].includes(ext)) return '📦';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return '🎬';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return '🎵';
  return '📄';
}

function PreviewContent({ objectKey, blob }: { objectKey: string; blob: Blob }) {
  const [textContent, setTextContent] = useState<string | null>(null);

  if (isImage(objectKey)) {
    const url = URL.createObjectURL(blob);
    return <img src={url} alt={getFileName(objectKey)} className="preview-image" />;
  }

  if (isTextFile(objectKey)) {
    if (textContent === null) {
      blob.text().then(setTextContent);
      return <div className="loading">Loading...</div>;
    }
    return <pre className="preview-text">{textContent}</pre>;
  }

  return <div className="preview-unsupported">Preview not available for this file type</div>;
}
