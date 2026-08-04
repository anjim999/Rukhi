import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { BookOpen, Users, Landmark, Clapperboard, Film } from 'lucide-react';
import {
  listStudioSeries,
  createStudioSeries,
  listStudioCharacters,
  createStudioCharacter,
  updateStudioCharacter,
  deleteStudioCharacter,
  bulkDeleteStudioCharacters,
  listStudioLocations,
  createStudioLocation,
  updateStudioLocation,
  deleteStudioLocation,
  bulkDeleteStudioLocations,
  preflightCheckStudio,
  orchestrateStudioScene,
  listStudioScenes,
  deleteStudioScene,
  bulkDeleteStudioScenes
} from '../services/studioService';
import SeriesBibleTab from '../components/studio/SeriesBibleTab';
import CharacterVaultTab from '../components/studio/CharacterVaultTab';
import LocationCatalogTab from '../components/studio/LocationCatalogTab';
import DirectorTimelineTab from '../components/studio/DirectorTimelineTab';
import SceneGalleryTab from '../components/studio/SceneGalleryTab';

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState('series');
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [locations, setLocations] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load Initial Series List
  useEffect(() => {
    fetchSeriesList();
  }, []);

  // Fetch Characters, Locations, and Scenes when selected series changes
  useEffect(() => {
    if (selectedSeries?.id) {
      fetchSeriesAssets(selectedSeries.id);
    }
  }, [selectedSeries]);

  const fetchSeriesList = async () => {
    try {
      const res = await listStudioSeries();
      let list = res.data || res || [];
      
      // Auto-seed Demo World Bible if DB is empty for first-time users
      if (list.length === 0) {
        try {
          const demoSeriesRes = await createStudioSeries({
            title: "Rahul's Legacy (Season 1)",
            genre: "Cinematic Drama",
            canonRules: [
              "Rahul never shaves his beard",
              "Primary setting is always Hyderabad",
              " Rahul wears dark hoodie after Episode 1"
            ],
            visualStyle: { camera: "35mm Cinematic", lighting: "Blue Hour Mood", lens: "50mm f/1.8" }
          });
          const demoSeries = demoSeriesRes.data || demoSeriesRes;

          if (demoSeries?.id) {
            await createStudioCharacter({
              seriesId: demoSeries.id,
              name: "Rahul Sharma",
              age: 28,
              personality: "Calm, intensely focused entrepreneur facing dramatic betrayals.",
              voiceProfile: { voice: "Chirp Male HD 01", speed: "1.0x" },
              referenceImages: [
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
              ],
              behaviorTraits: ["Drives black BMW", "Wears black hoodie", "Right arm injury from Ep 4"]
            });

            await createStudioLocation({
              seriesId: demoSeries.id,
              name: "Villa A - Living Room",
              locationType: "Interior",
              referenceImages: [
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80"
              ],
              lightingPreset: "Blue Hour Mood",
              environmentSpecs: { acoustics: "Soft Echo", timeOfDay: "Night" }
            });

            list = [demoSeries];
          }
        } catch (seedErr) {
          console.error("Auto-seed demo series error:", seedErr);
        }
      }

      setSeriesList(list);
      if (list.length > 0) {
        setSelectedSeries(list[0]);
      }
    } catch (err) {
      console.error('Failed to list studio series:', err);
    }
  };

  const fetchSeriesAssets = async (seriesId) => {
    try {
      const [charRes, locRes, sceneRes] = await Promise.all([
        listStudioCharacters(seriesId),
        listStudioLocations(seriesId),
        listStudioScenes(seriesId)
      ]);
      setCharacters(charRes.data || charRes || []);
      setLocations(locRes.data || locRes || []);
      setScenes(sceneRes.data || sceneRes || []);
    } catch (err) {
      console.error('Failed to list series assets:', err);
    }
  };

  const handleCreateSeries = async (payload) => {
    setLoading(true);
    console.log('[RUKHI STUDIO LOG] 🎬 Creating new Series Bible:', payload.title);
    try {
      const res = await createStudioSeries(payload);
      const newSeries = res.data || res;
      setSeriesList([newSeries, ...seriesList]);
      setSelectedSeries(newSeries);
      setActiveTab('characters');
      toast.success(`Series Bible "${newSeries.title}" created successfully!`);
      console.log('[RUKHI STUDIO LOG] ✅ Series Bible created:', newSeries.id);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to create Series Bible:', err);
      toast.error('Failed to create Series Bible: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharacter = async (payload) => {
    setLoading(true);
    console.log('[RUKHI STUDIO LOG] 🎭 Saving Master Character DNA:', payload.name);
    try {
      const res = await createStudioCharacter(payload);
      const newChar = res.data || res;
      setCharacters([...characters, newChar]);
      toast.success(`Character DNA "${newChar.name}" locked & saved!`);
      console.log('[RUKHI STUDIO LOG] ✅ Character saved successfully:', newChar.id);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to save character DNA:', err);
      toast.error('Failed to save character DNA: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCharacter = async (id, payload) => {
    setLoading(true);
    console.log('[RUKHI STUDIO LOG] ✏️ Updating Character DNA:', id, payload.name);
    try {
      const res = await updateStudioCharacter(id, payload);
      const updated = res.data || res;
      setCharacters(characters.map((c) => (c.id === id ? updated : c)));
      toast.success(`Character DNA "${updated.name}" updated successfully!`);
      console.log('[RUKHI STUDIO LOG] ✅ Character updated:', id);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to update character:', err);
      toast.error('Failed to update character: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCharacter = async (id) => {
    console.log('[RUKHI STUDIO LOG] 🗑️ Deleting Character:', id);
    try {
      await deleteStudioCharacter(id);
      setCharacters(characters.filter((c) => c.id !== id));
      toast.success('Character DNA removed from vault');
      console.log('[RUKHI STUDIO LOG] ✅ Character deleted:', id);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to delete character:', err);
      toast.error('Failed to delete character: ' + err.message);
    }
  };

  const handleBulkDeleteCharacters = async (ids) => {
    console.log('[RUKHI STUDIO LOG] 🗑️ Bulk deleting characters:', ids.length);
    try {
      await bulkDeleteStudioCharacters(ids);
      setCharacters(characters.filter((c) => !ids.includes(c.id)));
      toast.success(`Deleted ${ids.length} character(s) from vault`);
      console.log('[RUKHI STUDIO LOG] ✅ Bulk delete characters completed');
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to bulk delete characters:', err);
      toast.error('Failed to delete selected characters: ' + err.message);
    }
  };

  const handleCreateLocation = async (payload) => {
    setLoading(true);
    console.log('[RUKHI STUDIO LOG] 🏛️ Registering Set Location:', payload.name);
    try {
      const res = await createStudioLocation(payload);
      const newLoc = res.data || res;
      setLocations([...locations, newLoc]);
      toast.success(`Set Location "${newLoc.name}" registered!`);
      console.log('[RUKHI STUDIO LOG] ✅ Location registered:', newLoc.id);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to save location asset:', err);
      toast.error('Failed to save location asset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (id, payload) => {
    setLoading(true);
    console.log('[RUKHI STUDIO LOG] ✏️ Updating Set Location:', id, payload.name);
    try {
      const res = await updateStudioLocation(id, payload);
      const updated = res.data || res;
      setLocations(locations.map((l) => (l.id === id ? updated : l)));
      toast.success(`Set Location "${updated.name}" updated!`);
      console.log('[RUKHI STUDIO LOG] ✅ Location updated:', id);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to update location:', err);
      toast.error('Failed to update location: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    console.log('[RUKHI STUDIO LOG] 🗑️ Deleting Set Location:', id);
    try {
      await deleteStudioLocation(id);
      setLocations(locations.filter((l) => l.id !== id));
      toast.success('Set location removed from catalog');
      console.log('[RUKHI STUDIO LOG] ✅ Location deleted:', id);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to delete location:', err);
      toast.error('Failed to delete location: ' + err.message);
    }
  };

  const handleBulkDeleteLocations = async (ids) => {
    console.log('[RUKHI STUDIO LOG] 🗑️ Bulk deleting locations:', ids.length);
    try {
      await bulkDeleteStudioLocations(ids);
      setLocations(locations.filter((l) => !ids.includes(l.id)));
      toast.success(`Deleted ${ids.length} set location(s)`);
      console.log('[RUKHI STUDIO LOG] ✅ Bulk delete locations completed');
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to bulk delete locations:', err);
      toast.error('Failed to delete selected locations: ' + err.message);
    }
  };

  const handleDeleteScene = async (id) => {
    console.log('[RUKHI STUDIO LOG] 🗑️ Deleting Scene clip:', id);
    try {
      await deleteStudioScene(id);
      setScenes(scenes.filter((s) => s.id !== id));
      toast.success('Scene clip deleted');
      console.log('[RUKHI STUDIO LOG] ✅ Scene clip deleted:', id);
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to delete scene clip:', err);
      toast.error('Failed to delete scene clip: ' + err.message);
    }
  };

  const handleBulkDeleteScenes = async (ids) => {
    console.log('[RUKHI STUDIO LOG] 🗑️ Bulk deleting scene clips:', ids.length);
    try {
      await bulkDeleteStudioScenes(ids);
      setScenes(scenes.filter((s) => !ids.includes(s.id)));
      toast.success(`Deleted ${ids.length} scene clip(s)`);
      console.log('[RUKHI STUDIO LOG] ✅ Bulk delete scenes completed');
    } catch (err) {
      console.error('[RUKHI STUDIO ERROR] Failed to bulk delete scene clips:', err);
      toast.error('Failed to delete selected scene clips: ' + err.message);
    }
  };

  const handlePreflightCheck = async (payload) => {
    const res = await preflightCheckStudio(payload);
    return res.data || res;
  };

  const handleGenerateScene = async (payload) => {
    const res = await orchestrateStudioScene(payload);
    const data = res.data || res;
    if (selectedSeries?.id) {
      fetchSeriesAssets(selectedSeries.id);
    }
    return data;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300">
      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('series')}
            className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'series'
                ? 'border-amber-500 text-amber-600 dark:text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Series Bible & Canon</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'characters'
                ? 'border-amber-500 text-amber-600 dark:text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Character DNA Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('locations')}
            className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'locations'
                ? 'border-amber-500 text-amber-600 dark:text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Location Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('director')}
            className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'director'
                ? 'border-amber-500 text-amber-600 dark:text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>AI Director Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'border-amber-500 text-amber-600 dark:text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Episode & Scene Gallery ({scenes.length})</span>
          </button>
        </div>

        {/* Tab Panels (Preserved across tab switching) */}
        <div className={activeTab === 'series' ? 'block' : 'hidden'}>
          <SeriesBibleTab
            seriesList={seriesList}
            selectedSeries={selectedSeries}
            onSelectSeries={setSelectedSeries}
            onCreateSeries={handleCreateSeries}
          />
        </div>

        <div className={activeTab === 'characters' ? 'block' : 'hidden'}>
          <CharacterVaultTab
            selectedSeries={selectedSeries}
            characters={characters}
            onCreateCharacter={handleCreateCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onBulkDeleteCharacters={handleBulkDeleteCharacters}
          />
        </div>

        <div className={activeTab === 'locations' ? 'block' : 'hidden'}>
          <LocationCatalogTab
            selectedSeries={selectedSeries}
            locations={locations}
            onCreateLocation={handleCreateLocation}
            onUpdateLocation={handleUpdateLocation}
            onDeleteLocation={handleDeleteLocation}
            onBulkDeleteLocations={handleBulkDeleteLocations}
          />
        </div>

        <div className={activeTab === 'director' ? 'block' : 'hidden'}>
          <DirectorTimelineTab
            selectedSeries={selectedSeries}
            characters={characters}
            locations={locations}
            onPreflightCheck={handlePreflightCheck}
            onGenerateScene={handleGenerateScene}
          />
        </div>

        <div className={activeTab === 'gallery' ? 'block' : 'hidden'}>
          <SceneGalleryTab
            selectedSeries={selectedSeries}
            scenes={scenes}
            onDeleteScene={handleDeleteScene}
            onBulkDeleteScenes={handleBulkDeleteScenes}
          />
        </div>
      </main>
    </div>
  );
}
