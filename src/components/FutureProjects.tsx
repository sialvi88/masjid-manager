import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Droplets, HeartPulse, Bath, CheckCircle2, Copy, ExternalLink, QrCode, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../translations';

interface ProjectImage {
  url: string;
  caption: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  mainImage: string;
  gallery: ProjectImage[];
  icon: React.ReactNode;
  color: string;
}

interface FutureProjectsProps {
  onDonateClick?: () => void;
}

function ImageWithFallback({ src, alt, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [error, setError] = useState(false);
  return (
    <img
      src={error ? 'https://images.unsplash.com/photo-1541447270888-83e8494f9c06?auto=format&fit=crop&q=80&w=800' : src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}

export default function FutureProjects({ onDonateClick }: FutureProjectsProps) {
  const { language } = useStore();
  const t = translations[language];
  const isRtl = language === 'ur';
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const projects: Project[] = [
    {
      id: 'dialysis',
      title: t.dialysisCenterTitle,
      description: t.dialysisCenterDesc,
      goal: 10000000, // 1 Crore
      raised: 0,
      mainImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
      gallery: [
        { url: 'https://images.unsplash.com/photo-1579154235828-4519fc965921?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.modernDialysisMachine },
        { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.hospitalInterior },
        { url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce2?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.medicalCheckup },
        { url: 'https://images.unsplash.com/photo-1538108149393-fdfd81895907?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.patientCare },
        { url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.modernLaboratory },
        { url: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.nursingStation },
        { url: 'https://images.unsplash.com/photo-1513224502586-d1e602410265?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.medicalEquipment },
        { url: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.hospitalCorridor },
        { url: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.surgicalUnit },
        { url: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.emergencyRoom },
        { url: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.pharmacy },
        { url: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.doctorsRoom },
        { url: 'https://images.unsplash.com/photo-1519494083224-216382a06208?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.patientWard },
        { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.hospitalBuilding },
        { url: 'https://images.unsplash.com/photo-1504813184591-01592fd03cf7?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.medicalStaff }
      ],

      icon: <HeartPulse className="w-8 h-8" />,
      color: 'from-blue-600 to-cyan-500'
    },
    {
      id: 'water',
      title: t.waterFilterPlantTitle,
      description: t.waterFilterPlantDesc,
      goal: 2700000, // 27 Lakh
      raised: 0,
      mainImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
      gallery: [
        { url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterFilterPlant },
        { url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.cleanWater },
        { url: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.filtrationSystem },
        { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterTesting },
        { url: 'https://images.unsplash.com/photo-1585829365291-1782bd023d40?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.industrialFilter },
        { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterStorage },
        { url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterSupply },
        { url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterPipes },
        { url: 'https://images.unsplash.com/photo-1550985543-f47f38aee65e?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterQuality },
        { url: 'https://images.unsplash.com/photo-1534951009808-df43b5913b86?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterFlow },
        { url: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.naturalWater },
        { url: 'https://images.unsplash.com/photo-1525310238294-7c2709c15304?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.glassOfWater },
        { url: 'https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterDrops },
        { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterSpring },
        { url: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterWaves }
      ],

      icon: <Droplets className="w-8 h-8" />,
      color: 'from-cyan-500 to-blue-400'
    },
    {
      id: 'wazoo',
      title: t.wazooKhanaTitle,
      description: t.wazooKhanaDesc,
      goal: 1500000,
      raised: 0,
      mainImage: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&q=80&w=800',
      gallery: [
        { url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.wazooKhana },
        { url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.islamicArchitecture },
        { url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.mosqueCourtyard },
        { url: 'https://images.unsplash.com/photo-1584551271441-709880ceabb2?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.ablutionTaps },
        { url: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.mosqueInterior },
        { url: 'https://images.unsplash.com/photo-1580983135655-641ae69388a8?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.islamicDesign },
        { url: 'https://images.unsplash.com/photo-1590076202481-26cf4ff1f8c4?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.mosqueDome },
        { url: 'https://images.unsplash.com/photo-1597935214981-086e8bd55162?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.prayerArea },
        { url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.mosqueLights },
        { url: 'https://images.unsplash.com/photo-1526675783603-7e5ff716ff39?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.islamicCalligraphy },
        { url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.mosqueMinaret },
        { url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.ablutionArea },
        { url: 'https://images.unsplash.com/photo-1584551271441-709880ceabb2?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.waterTap },
        { url: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.mosqueWindows },
        { url: 'https://images.unsplash.com/photo-1580983135655-641ae69388a8?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.islamicArt }
      ],

      icon: <Bath className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-400'
    },
    {
      id: 'washrooms',
      title: t.washroomsTitle,
      description: t.washroomsDesc,
      goal: 1000000,
      raised: 0,
      mainImage: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=800',
      gallery: [
        { url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.modernWashroom },
        { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.bathroomDesign },
        { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.cleanliness },
        { url: 'https://images.unsplash.com/photo-1620626011761-9963d7521477?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.modernTaps },
        { url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.tilesDesign },
        { url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.bathroomFittings },
        { url: 'https://images.unsplash.com/photo-1600566752355-397921163bc9?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.modernSink },
        { url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.bathroomLighting },
        { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.mirrorDesign },
        { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6f3ea?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.bathroomCabinet },
        { url: 'https://images.unsplash.com/photo-1600566752355-397921163bc9?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.whiteTiles },
        { url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.luxuryBathroom },
        { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.bathroomFloor },
        { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6f3ea?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.bathroomWalls },
        { url: 'https://images.unsplash.com/photo-1600566752355-397921163bc9?auto=format&fit=crop&q=80&w=1200', caption: t.gallery.modernFacilities }
      ],

      icon: <Building2 className="w-8 h-8" />,
      color: 'from-amber-500 to-orange-400'
    }
  ];

  const formatCurrency = (num: number) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)} ${t.crore}`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)} ${t.lakh}`;
    return num.toLocaleString();
  };

  return (
    <div className={`p-4 md:p-8 space-y-8 md:space-y-12 pb-32 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-center space-y-3 md:space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight"
        >
          {t.futureProjects}
        </motion.h1>
        <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          {t.donationSupportMessage}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {projects.map((project, index) => {
          const percentage = Math.min(Math.round((project.raised / project.goal) * 100), 100);
          
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col"
            >
              {/* Image Header */}
              <div className="relative h-56 md:h-72 overflow-hidden cursor-pointer" onClick={() => {
                setSelectedProject(project);
                setActiveImageIndex(0);
              }}>
                <ImageWithFallback 
                  src={project.mainImage} 
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${project.color} opacity-40 mix-blend-multiply group-hover:opacity-30 transition-opacity`} />
                <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} bg-white/25 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs md:text-sm font-bold flex items-center gap-2 border border-white/20`}>
                  <Info className="w-3 h-3 md:w-4 md:h-4" />
                  {t.viewImages} ({project.gallery.length})
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="flex items-center gap-3 md:gap-4 text-white">
                    <div className="p-2 md:p-3 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl shrink-0">
                      {React.cloneElement(project.icon as React.ReactElement, { className: "w-6 h-6 md:w-8 md:h-8" })}
                    </div>
                    <h2 className="text-xl md:text-3xl font-black leading-tight drop-shadow-md">{project.title}</h2>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 md:p-8 flex-1 flex flex-col justify-between space-y-6">
                <p className="text-gray-600 text-sm md:text-lg leading-relaxed font-medium">
                  {project.description}
                </p>

                {/* Progress Section */}
                <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">{t.raisedAmount}</p>
                      <p className="text-lg md:text-2xl font-black text-emerald-600 tabular-nums">{formatCurrency(project.raised)}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">{t.totalGoal}</p>
                      <p className="text-lg md:text-2xl font-black text-gray-900 tabular-nums">{formatCurrency(project.goal)}</p>
                    </div>
                  </div>

                  <div className="relative h-2.5 md:h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`absolute inset-y-0 ${isRtl ? 'right-0' : 'left-0'} bg-gradient-to-r ${project.color} rounded-full flex items-center justify-center`}
                    >
                      {percentage > 10 && <div className="w-1 h-full bg-white/20 animate-pulse" />}
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[11px] md:text-sm font-black text-gray-500">
                    <span className="text-blue-600">{percentage}% {t.completed}</span>
                    <span className="italic">{t.remaining}: {formatCurrency(project.goal - project.raised)}</span>
                  </div>
                </div>

                <button 
                  onClick={onDonateClick}
                  className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-r ${project.color} text-white font-black text-sm md:text-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 group`}
                >
                  <QrCode className="w-5 h-5 md:w-7 md:h-7 group-hover:rotate-12 transition-transform" />
                  {t.donateForThisProject}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="p-4 md:p-6 flex justify-between items-center text-white bg-gradient-to-b from-black/80 to-transparent shrink-0">
              <div className="max-w-[70%]">
                <h2 className="text-lg md:text-2xl font-bold truncate">{selectedProject.title}</h2>
                <p className="text-xs md:text-sm text-gray-400">{t.imageOf} {activeImageIndex + 1} {t.of} {selectedProject.gallery.length}</p>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                title={t.close}
              >
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-2 md:p-4 overflow-hidden">
              <button 
                onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : selectedProject.gallery.length - 1))}
                className="absolute left-2 md:left-4 z-40 p-3 md:p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <motion.div 
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 0.95, x: isRtl ? 20 : -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className="relative flex-1 w-full flex items-center justify-center overflow-hidden"
                >
                  <ImageWithFallback 
                    src={selectedProject.gallery[activeImageIndex].url} 
                    alt="Gallery" 
                    className="max-w-full max-h-[70vh] w-auto h-auto object-contain shadow-2xl rounded-xl border border-white/5"
                  />
                  <div className="absolute bottom-2 left-2 right-2 md:bottom-6 md:left-6 md:right-6 p-4 md:p-6 bg-black/60 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl">
                    <p className="text-sm md:text-xl text-white font-semibold text-center leading-tight">
                      {selectedProject.gallery[activeImageIndex].caption}
                    </p>
                  </div>
                </motion.div>

                <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar w-full max-w-4xl px-4">
                  {selectedProject.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-24 h-16 md:w-32 md:h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ring-offset-2 ring-offset-black ${
                        activeImageIndex === idx ? 'ring-2 ring-blue-500 scale-105 z-10' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                      }`}
                    >
                      <ImageWithFallback src={img.url} className="w-full h-full object-cover" />
                      {activeImageIndex === idx && (
                        <div className="absolute inset-0 bg-blue-500/10" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setActiveImageIndex(prev => (prev < selectedProject.gallery.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 md:right-4 z-40 p-3 md:p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
