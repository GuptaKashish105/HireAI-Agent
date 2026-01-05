
import React from 'react';
import { UserProfile } from '../types';

interface ProfileCardProps {
  profile: UserProfile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      <div className="px-6 pb-6 -mt-10">
        <div className="relative">
          <img 
            src={`https://picsum.photos/seed/${profile.name}/200/200`} 
            alt={profile.name}
            className="w-20 h-20 rounded-xl border-4 border-white shadow-md bg-white"
          />
        </div>
        
        <div className="mt-4">
          <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
          <p className="text-sm text-slate-600 font-medium leading-tight mt-1">{profile.headline}</p>
          {profile.totalYearsOfExperience !== undefined && (
             <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg border border-blue-100">
               {profile.totalYearsOfExperience} Years Experience
             </span>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Core</h4>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Experience</h4>
            {profile.experience.slice(0, 2).map((exp, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <p className="text-sm font-semibold text-slate-800">{exp.role}</p>
                <p className="text-xs text-slate-500">{exp.company} • {exp.duration}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 italic leading-relaxed">
              "{profile.summary}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
