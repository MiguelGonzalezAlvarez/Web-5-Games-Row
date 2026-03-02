import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import type { Post } from '../../utils/types';
import styles from './CommunityFeed.module.css';

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostUrl, setNewPostUrl] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await api.getPosts();
        setPosts(data);
      } catch (err) {
        setError('Failed to load posts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostUrl.trim()) return;

    setSubmitting(true);
    try {
      const post = await api.createPost({
        image_url: newPostUrl,
        caption: newPostCaption,
      });
      setPosts([post, ...posts]);
      setNewPostUrl('');
      setNewPostCaption('');
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const result = await api.likePost(postId);
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes_count: result.likes_count } : p
      ));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading community posts...</div>;
  }

  return (
    <div className={styles.community}>
      <div className={styles.createPost}>
        <h3>Share Your Support</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="url"
            placeholder="Image URL (paste a photo URL)"
            value={newPostUrl}
            onChange={(e) => setNewPostUrl(e.target.value)}
            className={styles.input}
            required
          />
          <textarea
            placeholder="Add a caption... (optional)"
            value={newPostCaption}
            onChange={(e) => setNewPostCaption(e.target.value)}
            className={styles.textarea}
            rows={2}
          />
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Posting...' : 'Share Post'}
          </button>
        </form>
      </div>

      <div className={styles.posts}>
        <h3>Community Posts</h3>
        {posts.length === 0 ? (
          <div className={styles.empty}>
            <p>No posts yet. Be the first to share your support!</p>
          </div>
        ) : (
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postImage}>
                  <img src={post.image_url} alt={post.caption || 'Community post'} />
                </div>
                <div className={styles.postContent}>
                  <p className={styles.caption}>{post.caption || 'No caption'}</p>
                  <div className={styles.postMeta}>
                    <span className={styles.author}>@{post.author.username}</span>
                    <button 
                      className={styles.likeBtn}
                      onClick={() => handleLike(post.id)}
                    >
                      ❤️ {post.likes_count}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
