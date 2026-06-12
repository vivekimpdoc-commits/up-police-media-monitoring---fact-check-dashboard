import React, { useState, useEffect } from 'react';
import { Twitter, Facebook, Instagram, RefreshCw, ExternalLink, ShieldAlert, Hash } from 'lucide-react';

interface SocialPost {
  id: string;
  platform: 'Twitter' | 'Facebook' | 'Instagram';
  user: string;
  handle: string;
  content: string;
  time: string;
  likes: number;
  retweets: number;
  isFakeNewsCandidate: boolean;
}

const mockPosts: SocialPost[] = [
  { id: '1', platform: 'Twitter', user: 'UP Police Info', handle: '@uppolice', content: 'सिपाही भर्ती परीक्षा के दौरान सभी केंद्रों पर कड़ी सुरक्षा व्यवस्था की गई है। अफ़वाहों पर ध्यान न दें। #UPPolice #SafeExam', time: '5m', likes: 1240, retweets: 430, isFakeNewsCandidate: false },
  { id: '2', platform: 'Facebook', user: 'Local News Lucknow', handle: '@lucknownews', content: '🚨 ब्रेकिंग: लखनऊ के एक सेंटर पर पेपर लीक होने की खबर? प्रशासन ने किया इनकार। छात्रों में भ्रम।', time: '12m', likes: 89, retweets: 45, isFakeNewsCandidate: true },
  { id: '3', platform: 'Twitter', user: 'Rahul Verma', handle: '@rahulv99', content: 'कल रात शहर में भारी पुलिस बल तैनात किया गया था। कुछ बड़ा होने वाला है क्या? @UPPolice', time: '22m', likes: 15, retweets: 2, isFakeNewsCandidate: false },
  { id: '4', platform: 'Instagram', user: 'Kanpur Updates', handle: '@kanpur.updates', content: 'कानपुर देहात में पुलिस द्वारा सघन चेकिंग अभियान जारी। यातायात के नियमों का पालन करें।', time: '1h', likes: 540, retweets: 0, isFakeNewsCandidate: false },
  { id: '5', platform: 'Twitter', user: 'Viral Check', handle: '@viral_truth', content: 'वायरल वीडियो जिसमें पुलिसकर्मियों को बल प्रयोग करते दिखाया गया है, वह उत्तर प्रदेश का नहीं बल्कि किसी अन्य राज्य का 3 साल पुराना वीडियो है। #FakeNews', time: '2h', likes: 2100, retweets: 890, isFakeNewsCandidate: false },
];

export default function SocialMediaWatch() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Initial load
    setPosts(mockPosts);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate fetching new posts by shuffling
      setPosts([...mockPosts].sort(() => Math.random() - 0.5));
      setIsRefreshing(false);
    }, 1500);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Twitter': return <Twitter className="w-5 h-5 text-sky-500" />;
      case 'Facebook': return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'Instagram': return <Instagram className="w-5 h-5 text-pink-600" />;
      default: return <Hash className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Social Media Live Watch</h2>
          <p className="text-slate-500 mt-2">Real-time monitoring of trending topics and potential fake news on social platforms.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={\`w-4 h-4 \${isRefreshing ? 'animate-spin' : ''}\`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trending Hashtags */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
              Trending Hashtags (UP)
            </h3>
            <div className="space-y-3">
              {['#UPPolice', '#PoliceBharti', '#Dial112', '#FakeNewsAlert', '#UPSTF'].map((tag, i) => (
                <div key={i} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                  <span className="font-medium text-slate-700">{tag}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{Math.floor(Math.random() * 50) + 10}k posts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-xl border border-slate-800 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-red-400" />
              Social Media Protocol
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Monitor viral content closely. Any content flagged as potential fake news should be forwarded to the Fact Check cell immediately.
            </p>
            <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-2 rounded-lg text-sm font-medium transition-colors">
              View Guidelines
            </button>
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 p-4 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Live Monitored Feed</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span>Live Connection Active</span>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {posts.map(post => (
                <div key={post.id} className={\`p-5 transition-colors hover:bg-slate-50 \${post.isFakeNewsCandidate ? 'bg-red-50/30' : ''}\`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center">
                          {post.user} 
                          {post.isFakeNewsCandidate && (
                            <span className="ml-2 flex items-center text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              Flagged
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">{post.handle} • {post.time}</div>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-slate-700 text-sm leading-relaxed mb-4">{post.content}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-slate-500">
                    <span className="flex items-center"><Hash className="w-4 h-4 mr-1" /> {post.likes} Likes</span>
                    <span className="flex items-center"><RefreshCw className="w-4 h-4 mr-1" /> {post.retweets} Shares</span>
                    {post.isFakeNewsCandidate && (
                      <button className="text-indigo-600 font-medium hover:underline text-xs flex items-center ml-auto">
                        Send to Fact Check &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
