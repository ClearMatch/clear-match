import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Trash2, Edit, Copy } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'message';
  content: string;
  variables: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export function Templates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Template>>({
    name: '',
    type: 'email' as const,
    content: '',
    variables: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchTemplates();
  }, [user, searchQuery]);

  async function fetchTemplates() {
    if (!user) return;

    try {
      let query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert([{
          name: formData.name,
          type: formData.type,
          content: formData.content,
          variables: formData.variables,
        }])
        .select()
        .single();

      if (error) throw error;

      setTemplates([data, ...templates]);
      setFormData({
        name: '',
        type: 'email',
        content: '',
        variables: {},
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from('templates')
        .update({
          name: formData.name,
          type: formData.type,
          content: formData.content,
          variables: formData.variables,
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, ...formData }
          : t
      ));
      setSelectedTemplate(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleEditClick = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content,
      variables: template.variables,
    });
    setIsEditing(true);
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert([{
          name: `${template.name} (Copy)`,
          type: template.type,
          content: template.content,
          variables: template.variables,
        }])
        .select()
        .single();

      if (error) throw error;

      setTemplates([data, ...templates]);
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setFormData({
              name: '',
              type: 'email',
              content: '',
              variables: {},
            });
            setIsEditing(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {isEditing ? (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Template Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Template Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'email' | 'message' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="email">Email</option>
                <option value="message">Message</option>
              </select>
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <div className="mt-1 border border-gray-300 rounded-md overflow-hidden">
                <Editor
                  height="400px"
                  defaultLanguage="markdown"
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value || '' })}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: 'off',
                    wordWrap: 'on',
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Use variables like {'{firstName}'}, {'{company}'}, etc. They will be replaced with actual values.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {selectedTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-4 text-center">Loading...</div>
            ) : templates.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No templates found</div>
            ) : (
              templates.map((template) => (
                <li key={template.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {template.name}
                          </p>
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {template.type}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <p>Last updated {new Date(template.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleDuplicateTemplate(template)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(template)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}