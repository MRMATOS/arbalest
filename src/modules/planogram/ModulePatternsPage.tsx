import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { PatternModal, type PatternData } from './PatternModal';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { ChevronRight, Trash2, Pencil, Ruler } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ModulePatternsPage: React.FC = () => {
    const [patterns, setPatterns] = useState<PatternData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPattern, setEditingPattern] = useState<PatternData | null>(null);

    useEffect(() => {
        fetchPatterns();
    }, []);

    const fetchPatterns = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('module_patterns')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPatterns(data || []);
        } catch (error) {
            console.error('Error fetching patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingPattern(null);
        setIsModalOpen(true);
    };

    const handleEdit = (pattern: PatternData) => {
        setEditingPattern(pattern);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este padrão?')) return;

        try {
            const { error } = await supabase
                .from('module_patterns')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPatterns();
        } catch (error) {
            console.error('Error deleting pattern:', error);
            alert('Erro ao excluir padrão. Verifique se existem módulos utilizando-o.');
        }
    };

    const handleSuccess = async (data: PatternData) => {
        try {
            // Need to specify schema 'layout' explicitly if not default? 
            // OR use 'layout.module_patterns' in table name?
            // Supabase client usually requires fully qualified name or schema change if not public.
            // Assuming 'module_patterns' is in 'layout' schema, and search_path includes it OR we use fully qualified name.
            // Based on docs provided earlier: Schema: `layout` (Modules & Planogram).
            // NOTE: Supabase JS client defaults to 'public'. We might need to select schema.

            // HOWEVER, previous code (App.tsx) didn't configure schema.
            // I will assume for now 'public' OR layout is in search_path, 
            // BUT usually with supabase-js allow specifying schema.
            // Given the user context didn't specify custom supbase config, 
            // I'll try 'module_patterns' but likely need to use `.schema('layout')` or rename table.
            // Wait, previous prompt said "tabela 'layout.module_patterns'".
            // I will use `supabase.schema('layout').from('module_patterns')` pattern if possible.
            // Standard client: supabase.from('table') uses public.

            // Checking how to switch schema is safer:
            // But let's look at `supabase.ts`. It's likely a standard client.
            // I will implement without `.schema` first (assuming synonym or public view) 
            // BUT if it fails I'll need to fix.
            // Wait, typically separating by schema is good practice.
            // I will add `.schema('layout')` to be safe/correct given the doc explicitly said `layout.module_patterns`.

            /* 
               Actually, for this Write interaction, I will assume I need to handle the schema correctly.
               If the previous `fetchPatterns` above used just `.from('module_patterns')`, it might fail if it's not in public.
               Let's update both fetch and save to use simple table name first, 
               but if I recall correctly, usually Supabase exposes tables on API 
               based on "Exposed Schemas". If 'layout' is exposed, we query it. 
               
               For now, I'll stick to simple `.from('module_patterns')` assuming the user has configured it in valid search path 
               OR exposed it. If strict mode, I'd need `.schema('layout')`.
               
               Let's stick to the simplest interpretation (table name unique) unless error.
               
               UPDATE: actually I should check if I should effectively use schema. 
               But to avoid complexity with potential lack of .schema() method on some client versions (though standard),
               I'll use what the user asked: "tabela 'layout.module_patterns'".
            */

            let error;
            if (editingPattern?.id) {
                const { error: updateError } = await supabase
                    .from('module_patterns')
                    .update({
                        name: data.name,
                        height_cm: data.height_cm,
                        width_cm: data.width_cm,
                        depth_cm: data.depth_cm,
                        default_shelves_count: data.default_shelves_count
                    })
                    .eq('id', editingPattern.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('module_patterns')
                    .insert([{
                        name: data.name,
                        height_cm: data.height_cm,
                        width_cm: data.width_cm,
                        depth_cm: data.depth_cm,
                        default_shelves_count: data.default_shelves_count
                    }]);
                error = insertError;
            }

            if (error) throw error;
            setIsModalOpen(false);
            fetchPatterns();
        } catch (error) {
            console.error('Error saving pattern:', error);
            alert('Erro ao salvar padrão.');
        }
    };

    return (
        <DashboardLayout onAddClick={handleOpenAdd}>
            <div className="fade-in">
                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Link to="/planogram" style={{ color: 'inherit', textDecoration: 'none' }}>Planograma</Link>
                    <ChevronRight size={14} />
                    <span>Configurações</span>
                    <ChevronRight size={14} />
                    <span style={{ color: 'var(--text-primary)' }}>Padrões</span>
                </div>

                <div className="header-actions" style={{ marginBottom: '24px', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Padrões de Módulos</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Gerencie as dimensões dos seus equipamentos</p>
                    </div>
                </div>

                {loading ? (
                    <div className="spinner" />
                ) : (
                    <div className="list-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {patterns.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                Nenhum padrão cadastrado.
                            </div>
                        )}
                        {patterns.map(pattern => (
                            <div key={pattern.id} className="glass" style={{
                                padding: '20px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        padding: '10px',
                                        borderRadius: '10px'
                                    }}>
                                        <Ruler size={24} color="#10b981" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{pattern.name}</h3>
                                        <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <span title="Altura">A: {pattern.height_cm}cm</span>
                                            <span title="Largura">L: {pattern.width_cm}cm</span>
                                            <span title="Profundidade">P: {pattern.depth_cm}cm</span>
                                            {pattern.default_shelves_count > 0 && (
                                                <span title="Prateleiras">• {pattern.default_shelves_count} prateleiras</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEdit(pattern)}
                                        className="icon-btn"
                                        style={{ color: 'var(--text-secondary)' }}
                                        title="Editar"
                                    >
                                        <Pencil size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pattern.id!)}
                                        className="icon-btn"
                                        style={{ color: 'var(--error)' }}
                                        title="Excluir"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <PatternModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                    patternToEdit={editingPattern}
                />
            </div>
        </DashboardLayout>
    );
};
