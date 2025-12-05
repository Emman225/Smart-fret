import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler, useFieldArray, Control, UseFormRegister, useWatch } from 'react-hook-form';
import { Dossier, DetailAdministratif } from '../../types';
import { createDossier } from '../../services/dossierService';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { DeleteIcon, PlusCircleIcon, RefreshIcon } from '../../components/icons';
import useOrigines from '../../hooks/useOrigines';
import useArmateurs from '../../hooks/useArmateurs';
import { useTypeDossiers, useNavires } from '../../context/AppContext';

const MySwal = withReactContent(Swal);
const createTempId = (prefix: string) => `temp-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyDetailAdministratif: DetailAdministratif = {
    nom: '', numFacture: '', date: '', numCC: '', montant: 0, montantTaxable: 0, montantTVA: 0,
};

const defaultValues: Dossier = {
    id: '', numeroDossier: '', origine: '', numFRI: '', numBSC: '', montantBSC: 0, numBL: '',
    date: '', armateur: '', navire: '', dateETA: '', numFactureVendeur: '', dateFactureVendeur: '',
    montantFacture: 0, devise: '', cours: 0, montantCFA: 0, montantAssurance: 0, incoterm: '',
    type: '', qte: 0, nbreTEU: 0, vendeur: '',
    items: [],
    prixReviens: [],
    nomTransit: '', numFactureTransit: '', dateFactureTransit: '', montantTransit: 0, droitDouane: 0, droitDTaxe: 0, montantTVADouane: 0, montantTSDouane: 0, fraisPhyto: 0, fraisDepotage: 0, numCCTransit: '', numDosTran: '', numDeclarant: '', dateDeclarant: '', montantTVAFactTrans: 0, montantTVAInterv: 0,
    aconnier: { ...emptyDetailAdministratif }, fret: { ...emptyDetailAdministratif }, transport: { ...emptyDetailAdministratif }, change: { ...emptyDetailAdministratif }, surestaire: { ...emptyDetailAdministratif }, magasinage: { ...emptyDetailAdministratif },
    reglements: [],
    teus: [],
};

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input
        ref={ref}
        {...props}
        className={`w-full border border-slate-300/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${props.className}`}
    />
));

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode; }>(({ children, ...props }, ref) => (
    <select
        ref={ref}
        {...props}
        className={`w-full border border-slate-300/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${props.className}`}
    >
        {children}
    </select>
));

const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-xl border border-slate-200/50 shadow-sm ${className}`}>
        <h2 className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold p-3 rounded-t-xl">{title}</h2>
        <div className="p-3 space-y-3">{children}</div>
    </div>
);

const CompactFieldWrapper: React.FC<{ label: string; children: React.ReactNode; error?: string, className?: string }> = ({ label, children, error, className = '' }) => (
    <div className={className}>
        <div className="grid grid-cols-3 items-center gap-2">
            <label className="col-span-1 text-xs font-medium text-slate-700 text-left pr-2">{label}</label>
            <div className="col-span-2">
                {children}
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
        </div>
    </div>
);

const DynamicTable: React.FC<{ title: string; children: React.ReactNode; onAdd: () => void; addLabel: string; }> = ({ title, children, onAdd, addLabel }) => (
    <div>
        {title && <h3 className="text-lg font-medium text-slate-700 mb-3">{title}</h3>}
        <div className="overflow-auto max-h-48 rounded-lg border border-slate-200">{children}</div>
        <button type="button" onClick={onAdd} className="mt-3 flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <PlusCircleIcon className="mr-2" /> {addLabel}
        </button>
    </div>
);

const DossierFormPage: React.FC = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(false);
    const { origines, loading: loadingOrigines, error: originesError, fetchOrigines } = useOrigines();
    const { typeDossiers, fetchTypeDossiers } = useTypeDossiers();
    const { navires, fetchNavires } = useNavires();
    const [loadingNavires, setLoadingNavires] = useState<boolean>(false);
    const [naviresError, setNaviresError] = useState<string | null>(null);
    const { armateurs, loading: loadingArmateurs, error: armateursError, fetchArmateurs } = useArmateurs();

    const handleCancel = () => {
        if (loading) return;
        try {
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate('/dossiers', { replace: true });
            }
        } catch {
            navigate('/dossiers', { replace: true });
        }
    };

    useEffect(() => {
        if (!origines.length) {
            fetchOrigines().catch(error => console.error('Erreur lors du chargement des origines:', error));
        }
    }, [origines.length, fetchOrigines]);

    useEffect(() => {
        if (!typeDossiers.length) {
            fetchTypeDossiers().catch(error => console.error('Erreur lors du chargement des types de dossier:', error));
        }
    }, [typeDossiers.length, fetchTypeDossiers]);

    useEffect(() => {
        let isMounted = true;
        const loadNavires = async () => {
            setLoadingNavires(true);
            try {
                await fetchNavires();
                if (isMounted) {
                    setNaviresError(null);
                }
            } catch (error: any) {
                console.error('Erreur lors du chargement des navires:', error);
                if (isMounted) {
                    setNaviresError("Erreur lors du chargement des navires");
                }
            } finally {
                if (isMounted) {
                    setLoadingNavires(false);
                }
            }
        };

        loadNavires();
        return () => {
            isMounted = false;
        };
    }, [fetchNavires]);

    useEffect(() => {
        // Certains mocks peuvent ne pas retourner une promesse; appeler de manière défensive
        try {
            const result = fetchArmateurs && fetchArmateurs();
            if (result && typeof (result as any).catch === 'function') {
                (result as any).catch((error: any) => console.error('Erreur lors du chargement des armateurs:', error));
            }
        } catch (error: any) {
            // silencieux en test si fetchArmateurs n'est pas une fonction
        }
    }, [fetchArmateurs]);

    const { register, handleSubmit, control, reset, setError, setValue, getValues, formState: { errors }, watch } = useForm<Dossier>({ defaultValues });

    const { fields: itemsFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: "items" });
    const { fields: prixReviensFields, append: appendPrixRevien, remove: removePrixRevien } = useFieldArray({ control, name: "prixReviens" });
    const { fields: reglementsFields, append: appendReglement, remove: removeReglement } = useFieldArray({ control, name: "reglements" });
    const { fields: teusFields, append: appendTeu, remove: removeTeu } = useFieldArray({ control, name: "teus" });
    const navireValue = watch('navire');
    const armateurValue = watch('armateur');
    const watchTeus = watch('teus');
    const watchReglements = watch('reglements');
    const watchCours = watch('cours');

    useEffect(() => {
        const count = Array.isArray(watchTeus) ? watchTeus.length : 0;
        setValue('nbreTEU', count);
    }, [watchTeus, setValue]);

    useEffect(() => {
        if (Array.isArray(watchReglements)) {
            watchReglements.forEach((reg, idx) => {
                const mdNum = Number(reg?.montantDevise);
                const cdNum = Number(reg?.coursDevise ?? watchCours);
                const md = Number.isFinite(mdNum) ? mdNum : 0;
                const cd = Number.isFinite(cdNum) ? cdNum : 0;
                const cfa = md * cd;
                setValue(`reglements.${idx}.montantCFA` as const, cfa, { shouldDirty: true });
            });
        }
    }, [watchReglements, setValue, watchCours]);

    const onSubmit: SubmitHandler<Dossier> = async (data) => {
        setLoading(true);
        try {
            // Préparer les données : si origine/type sont des ids (string), convertir en objet { id }
            const payload: any = { ...data };
            if (payload.origine !== undefined && payload.origine !== null && payload.origine !== '') {
                const maybeId = Number(payload.origine);
                if (!Number.isNaN(maybeId)) {
                    const found = origines.find(o => Number(o.idOrigine) === maybeId);
                    payload.origine = { id: maybeId, nom: found?.nomPays || '' };
                }
            }
            if (payload.type !== undefined && payload.type !== null && payload.type !== '') {
                const maybeTid = Number(payload.type);
                if (!Number.isNaN(maybeTid)) {
                    const foundT = typeDossiers.find(t => Number(t.id) === maybeTid);
                    payload.type = { id: maybeTid, libelle: foundT?.typeDossier || '' };
                }
            }

            await createDossier(payload);

            await MySwal.fire({
                title: 'Succès !',
                text: 'Le dossier a été créé avec succès.',
                icon: 'success',
                background: '#334155',
                color: '#f8fafc'
            });

            navigate('/dossiers');
        } catch (error: any) {
            console.error('Erreur lors de la sauvegarde:', error);

            if (error.response?.status === 422 && error.response.data?.errors) {
                const validationErrors = error.response.data.errors;
                // Parcourir erreurs de validation pour chaque champ
                for (const [fieldName, messages] of Object.entries(validationErrors)) {
                    const message = Array.isArray(messages) ? messages.join(', ') : String(messages);
                    setError(fieldName as any, { type: 'server', message });
                }
            } else {
                await MySwal.fire({
                    title: 'Erreur',
                    text: error.message || 'Erreur lors de la création du dossier',
                    icon: 'error',
                    background: '#334155',
                    color: '#f8fafc'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const renderOrigineOptions = () => {
        if (loadingOrigines) {
            return <option value="">Chargement des origines...</option>;
        }
        if (originesError) {
            return <option value="">Erreur lors du chargement des origines</option>;
        }
        if (!origines.length) {
            return <option value="">Aucune origine disponible</option>;
        }
        return origines.map((origine) => (
            <option key={origine.idOrigine} value={origine.idOrigine}>{origine.nomPays}</option>
        ));
    };

    const renderTypeOptions = () => {
        if (!typeDossiers.length) {
            return <option value="">Chargement des types...</option>;
        }
        return typeDossiers.map((type) => (
            <option key={type.id} value={type.id}>{type.typeDossier}</option>
        ));
    };

    const renderArmateurOptions = () => {
        if (loadingArmateurs) {
            return <option value="">Chargement des armateurs...</option>;
        }
        if (armateursError) {
            return <option value="">{armateursError}</option>;
        }
        if (!armateurs.length) {
            return <option value="">Aucun armateur disponible</option>;
        }

        const hasCurrentValue = armateurValue ? armateurs.some(a => String(a.IdArmat) === String(armateurValue)) : false;

        return (
            <>
                <option value="">Sélectionner un armateur</option>
                {!hasCurrentValue && armateurValue && (
                    <option value={armateurValue}>{armateurValue} (valeur actuelle)</option>
                )}
                {armateurs.map((armateur) => (
                    <option key={armateur.IdArmat} value={String(armateur.IdArmat)}>{armateur.NomArmat}</option>
                ))}
            </>
        );
    };

    const renderNavireOptions = () => {
        if (loadingNavires) {
            return <option value="">Chargement des navires...</option>;
        }
        if (naviresError) {
            return <option value="">{naviresError}</option>;
        }
        if (!navires.length) {
            return <option value="">Aucun navire disponible</option>;
        }

        const hasCurrentValue = navireValue ? navires.some(navire => String(navire.id) === String(navireValue)) : false;

        return (
            <>
                <option value="">Sélectionner un navire</option>
                {!hasCurrentValue && navireValue && (
                    <option value={navireValue}>{navireValue} (valeur actuelle)</option>
                )}
                {navires.map((navire) => (
                    <option key={navire.id} value={String(navire.id)}>
                        {navire.nomNavire}{navire.armateurName ? ` - ${navire.armateurName}` : ''}
                    </option>
                ))}
            </>
        );
    };

    const CompactField: React.FC<{ register: UseFormRegister<Dossier>, label: string; name: string; type?: string; }> = ({ register, label, name, type = "text" }) => {
        const props = type === 'number' ? { valueAsNumber: true } : {};
        return (
            <div className="grid grid-cols-3 items-center gap-2">
                <label className="col-span-1 text-xs font-medium text-slate-500 text-left pr-2">{label}</label>
                <div className="col-span-2">
                    <Input
                        type={type}
                        className="py-1 px-2 text-xs"
                        {...register(name as any, props)}
                    />
                </div>
            </div>
        );
    };

    const DetailAdminSubSection: React.FC<{ register: UseFormRegister<Dossier>, fieldName: keyof Pick<Dossier, 'aconnier' | 'fret' | 'transport' | 'change' | 'surestaire' | 'magasinage'>, title: string }> = ({ register, fieldName, title }) => {
        return (
            <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1">{title}</h3>
                <CompactField register={register} label="Nom" name={`${fieldName}.nom`} />
                <CompactField register={register} label="N° Facture" name={`${fieldName}.numFacture`} />
                <CompactField register={register} label="Date" name={`${fieldName}.date`} type="date" />
                <CompactField register={register} label="N° C.C" name={`${fieldName}.numCC`} />
                <CompactField register={register} label="Montant" name={`${fieldName}.montant`} type="number" />
                <CompactField register={register} label="Mt taxable" name={`${fieldName}.montantTaxable`} type="number" />
                <CompactField register={register} label="Mt T.V.A" name={`${fieldName}.montantTVA`} type="number" />
            </div>
        );
    };

    const compactInputProps = { className: "py-1 px-2 text-xs" };
    const reglementInputClass = "py-1 px-2 text-xs w-full";

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pb-40 w-full">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 w-full">
                {/* --- LEFT & MIDDLE COLUMNS --- */}
                <div className="xl:col-span-2 space-y-2">
                    <FormSection title="Dossier Livraison">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                            <CompactFieldWrapper label="N° Dossier"><Input {...register('numeroDossier', { required: true })} {...compactInputProps} /></CompactFieldWrapper>
                            <CompactFieldWrapper label="Origine">
                                <Select
                                    {...register('origine')}
                                    {...compactInputProps}
                                    disabled={loadingOrigines}
                                >
                                    <option value="">Sélectionner une origine</option>
                                    {renderOrigineOptions()}
                                </Select>
                                {originesError && (
                                    <p className="text-red-500 text-xs mt-1">{originesError}</p>
                                )}
                            </CompactFieldWrapper>
                            <CompactFieldWrapper label="N° FRI"><Input {...register('numFRI')} {...compactInputProps} /></CompactFieldWrapper>
                            <CompactFieldWrapper label="N° BSC"><Input {...register('numBSC')} {...compactInputProps} /></CompactFieldWrapper>
                            <CompactFieldWrapper label="Montant BSC"><Input type="number" {...register('montantBSC', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                            <CompactFieldWrapper label="Type">
                                <Select
                                    {...register('type')}
                                    {...compactInputProps}
                                    disabled={!typeDossiers.length}
                                >
                                    <option value="">Sélectionner un type</option>
                                    {renderTypeOptions()}
                                </Select>
                            </CompactFieldWrapper>
                            <CompactFieldWrapper label="Vendeur"><Input {...register('vendeur')} {...compactInputProps} /></CompactFieldWrapper>
                            <CompactFieldWrapper label="Quantité"><Input type="number" {...register('qte', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                            <CompactFieldWrapper label="Nombre T.E.U"><Input type="number" {...register('nbreTEU', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                        </div>
                        <br />
                        <br />
                        <DynamicTable title="" onAdd={() => appendItem({ id: createTempId('item'), quantite: 0, designation: '', fob: 0 })} addLabel="Ajouter">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="sticky top-0 z-10 bg-slate-900 text-white"><tr className="text-left text-xs font-medium uppercase">
                                    <th className="p-1">Quantité</th><th className="p-1">Désignation</th><th className="p-1">FOB</th><th className="w-12"></th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {itemsFields.map((field, index) => (
                                        <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-1 w-32"><Input type="number" {...register(`items.${index}.quantite`, { valueAsNumber: true })} {...compactInputProps} /></td>
                                            <td className="p-1">
                                                <Input {...register(`items.${index}.designation`, { required: 'La désignation est requise' })} {...compactInputProps} />
                                                {errors.items?.[index]?.designation && (
                                                    <p className="text-red-500 text-xs mt-1">{(errors.items[index] as any).designation.message}</p>
                                                )}
                                            </td>
                                            <td className="p-1 w-40"><Input type="number" {...register(`items.${index}.fob`, { valueAsNumber: true })} {...compactInputProps} /></td>
                                            <td className="p-1 text-center"><button type="button" onClick={() => removeItem(index)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><DeleteIcon className="w-4 h-4" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DynamicTable>
                        <br />
                        <br />

                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                <CompactFieldWrapper label="N° BL"><Input {...register('numBL')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Date"><Input type="date" {...register('date')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Armateur" error={armateursError || undefined}>
                                    <Select
                                        {...register('armateur')}
                                        {...compactInputProps}
                                        disabled={loadingArmateurs && !armateurs.length}
                                    >
                                        {renderArmateurOptions()}
                                    </Select>
                                </CompactFieldWrapper>
                                <CompactFieldWrapper label="Navire" error={naviresError || undefined}>
                                    <Select
                                        {...register('navire')}
                                        {...compactInputProps}
                                        disabled={loadingNavires && !navires.length}
                                    >
                                        {renderNavireOptions()}
                                    </Select>
                                </CompactFieldWrapper>
                                <CompactFieldWrapper label="Date E.T.A"><Input type="date" {...register('dateETA')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="N° Fact. vendeur"><Input {...register('numFactureVendeur')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Date Fact. vendeur"><Input type="date" {...register('dateFactureVendeur')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Mt facture"><Input type="number" {...register('montantFacture', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Incoterm"><Input {...register('incoterm')} {...compactInputProps} /></CompactFieldWrapper>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                                <CompactFieldWrapper label="Devise"><Input {...register('devise')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Cours"><Input type="number" {...register('cours', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Montant CFA"><Input type="number" {...register('montantCFA', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Montant assurance"><Input type="number" {...register('montantAssurance', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Calcul Prix Unitaire">
                        <DynamicTable title="" onAdd={() => appendPrixRevien({ id: createTempId('prix-revient'), designation: '', quantite: 0, fob: 0, cfa: 0, percentage: 0, prixRevient: 0 })} addLabel="Ajouter une ligne de calcul">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="sticky top-0 z-10 bg-slate-900 text-white"><tr className="text-left text-xs font-medium uppercase">
                                    <th className="p-1">Désignation</th><th className="p-1">Qté</th><th className="p-1">FOB</th><th className="p-1">CFA</th><th className="p-1">%</th><th className="p-1">Prix Revient</th><th className="w-12"></th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {prixReviensFields.map((field, index) => (
                                        <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-1">
                                                <Input {...register(`prixReviens.${index}.designation`, { required: 'La désignation est requise' })} {...compactInputProps} />
                                                {errors.prixReviens?.[index]?.designation && (
                                                    <p className="text-red-500 text-xs mt-1">{(errors.prixReviens[index] as any).designation.message}</p>
                                                )}
                                            </td>
                                            <td className="p-1 w-20"><Input type="number" {...register(`prixReviens.${index}.quantite`, { valueAsNumber: true })} {...compactInputProps} /></td>
                                            <td className="p-1 w-24"><Input type="number" {...register(`prixReviens.${index}.fob`, { valueAsNumber: true })} {...compactInputProps} /></td>
                                            <td className="p-1 w-24"><Input type="number" {...register(`prixReviens.${index}.cfa`, { valueAsNumber: true })} {...compactInputProps} /></td>
                                            <td className="p-1 w-16"><Input type="number" {...register(`prixReviens.${index}.percentage`, { valueAsNumber: true })} {...compactInputProps} /></td>
                                            <td className="p-1 w-24"><Input type="number`" {...register(`prixReviens.${index}.prixRevient`, { valueAsNumber: true })} {...compactInputProps} /></td>
                                            <td className="p-1 text-center"><button type="button" onClick={() => removePrixRevien(index)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><DeleteIcon className="w-4 h-4" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DynamicTable>
                    </FormSection>

                    <FormSection title="Douanes">
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                <CompactFieldWrapper label="Nom Transit"><Input {...register('nomTransit')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="N° Facture Transit"><Input {...register('numFactureTransit')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Date Facture Transit"><Input type="date" {...register('dateFactureTransit')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Montant Transit"><Input type="number" {...register('montantTransit', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Droit Douane"><Input type="number" {...register('droitDouane', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Droit D. taxe"><Input type="number" {...register('droitDTaxe', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Mt TVA Douane"><Input type="number" {...register('montantTVADouane', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Mt TS Douane"><Input type="number" {...register('montantTSDouane', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Frais Phyto"><Input type="number" {...register('fraisPhyto', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Frais Dépotage"><Input type="number" {...register('fraisDepotage', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="N° CC Transit"><Input {...register('numCCTransit')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="N° Dos. Tran."><Input {...register('numDosTran')} {...compactInputProps} /></CompactFieldWrapper>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                                <CompactFieldWrapper label="N° Déclarant"><Input {...register('numDeclarant')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Date Déclarant"><Input type="date" {...register('dateDeclarant')} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Mt TVA Fact. Trans"><Input type="number" {...register('montantTVAFactTrans', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                                <CompactFieldWrapper label="Mt TVA Interv."><Input type="number" {...register('montantTVAInterv', { valueAsNumber: true })} {...compactInputProps} /></CompactFieldWrapper>
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="xl:col-span-1">
                    <FormSection title="Détails Administratifs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailAdminSubSection register={register} fieldName="aconnier" title="Aconnier" />
                            <DetailAdminSubSection register={register} fieldName="fret" title="Fret" />
                            <DetailAdminSubSection register={register} fieldName="transport" title="Transport" />
                            <DetailAdminSubSection register={register} fieldName="change" title="Change" />
                            <DetailAdminSubSection register={register} fieldName="surestaire" title="Surestaire" />
                            <DetailAdminSubSection register={register} fieldName="magasinage" title="Magasinage" />
                        </div>
                    </FormSection>
                    <div className="mt-2">
                        <FormSection title="T.E.U (Conteneurs)">
                            <div className="max-h-48 overflow-y-auto pr-2 space-y-3">
                                {teusFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center space-x-2">
                                        <div className="flex-1">
                                            <Input {...register(`teus.${index}.numero`, { required: 'Le numéro du conteneur est requis' })} placeholder={`N° Conteneur ${index + 1}`} {...compactInputProps} />
                                            {errors.teus?.[index]?.numero && (
                                                <p className="text-red-500 text-xs mt-1">{(errors.teus[index] as any).numero.message}</p>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => removeTeu(index)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><DeleteIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => appendTeu({ id: createTempId('teu'), numero: '' })} className="mt-3 flex items-center text-sm font-medium text-primary hover:text-blue-700 transition-colors">
                                <PlusCircleIcon className="mr-2" /> Ajouter un conteneur
                            </button>
                        </FormSection>
                    </div>
                </div>
            </div>

            <div className="w-full mt-2">
                <FormSection title="Règlements" className="pb-16">
                    <DynamicTable title="" onAdd={() => appendReglement({ id: createTempId('reglement'), date: '', reference: '', modePaiement: 'Virement', banque: '', montantDevise: 0, devise: 'USD', coursDevise: 0, montantCFA: 0, montantTPS: 0, fraisBancaires: 0 })} addLabel="Ajouter un règlement">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-900 text-white"><tr className="text-left text-xs font-medium uppercase">
                                <th className="px-2 py-1 w-24">Date</th>
                                <th className="px-2 py-1 w-28">Réf.</th>
                                <th className="px-2 py-1 w-28">Mode</th>
                                <th className="px-2 py-1 w-28">Banque</th>
                                <th className="px-2 py-1 w-28">Mt Devise</th>
                                <th className="px-2 py-1 w-20">Devise</th>
                                <th className="px-2 py-1 w-20">Cours</th>
                                <th className="px-2 py-1 w-28">Mt CFA</th>
                                <th className="px-2 py-1 w-28">Mt TPS</th>
                                <th className="px-2 py-1 w-28">Frais Banc.</th>
                                <th className="w-12"></th>
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {reglementsFields.map((field, index) => (
                                    <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-1"><Input type="date" className={reglementInputClass} {...register(`reglements.${index}.date`)} /></td>
                                        <td className="p-1"><Input className={reglementInputClass} {...register(`reglements.${index}.reference`)} /></td>
                                        <td className="p-1"><Select className={reglementInputClass} {...register(`reglements.${index}.modePaiement`)}><option>Virement</option><option>Chèque</option></Select></td>
                                        <td className="p-1"><Input className={reglementInputClass} {...register(`reglements.${index}.banque`)} /></td>
                                        <td className="p-1"><Input type="number" className={reglementInputClass} {...register(`reglements.${index}.montantDevise`, {
                                            valueAsNumber: true, onChange: (e) => {
                                                const md = (e.target as HTMLInputElement).valueAsNumber;
                                                const cdRaw = getValues(`reglements.${index}.coursDevise` as const) ?? getValues('cours');
                                                const cd = Number.isFinite(Number(cdRaw)) ? Number(cdRaw) : 0;
                                                const cfa = (Number.isFinite(md) ? md : 0) * cd;
                                                setValue(`reglements.${index}.montantCFA` as const, cfa, { shouldDirty: true });
                                            }
                                        })} /></td>
                                        <td className="p-1 w-20"><Select className={reglementInputClass} {...register(`reglements.${index}.devise`)}><option>USD</option><option>EUR</option></Select></td>
                                        <td className="p-1 w-20"><Input type="number" className={reglementInputClass} {...register(`reglements.${index}.coursDevise`, {
                                            valueAsNumber: true, onChange: (e) => {
                                                const cd = (e.target as HTMLInputElement).valueAsNumber;
                                                const mdRaw = getValues(`reglements.${index}.montantDevise` as const);
                                                const md = Number.isFinite(Number(mdRaw)) ? Number(mdRaw) : 0;
                                                const cfa = md * (Number.isFinite(cd) ? cd : 0);
                                                setValue(`reglements.${index}.montantCFA` as const, cfa, { shouldDirty: true });
                                            }
                                        })} /></td>
                                        <td className="p-1"><Input type="number" className={reglementInputClass} {...register(`reglements.${index}.montantCFA`, { valueAsNumber: true })} /></td>
                                        <td className="p-1"><Input type="number" className={reglementInputClass} {...register(`reglements.${index}.montantTPS`, { valueAsNumber: true })} /></td>
                                        <td className="p-1"><Input type="number" className={reglementInputClass} {...register(`reglements.${index}.fraisBancaires`, { valueAsNumber: true })} /></td>
                                        <td className="p-1 text-center"><button type="button" onClick={() => removeReglement(index)} className="text-red-500 p-1 rounded-full hover:bg-red-100"><DeleteIcon className="w-4 h-4" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DynamicTable>
                </FormSection>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 p-4 flex justify-end space-x-4 shadow-lg z-30">
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-100 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-500/40 hover:-translate-y-0.5 text-sm font-medium transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    {loading && <RefreshIcon className="w-4 h-4 animate-spin" />}
                    <span>{loading ? 'Création en cours…' : 'Créer le dossier'}</span>
                </button>
            </div>
            {
                loading && (
                    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
                        <div className="bg-white rounded-lg px-4 py-3 flex items-center space-x-3 shadow-xl">
                            <RefreshIcon className="w-5 h-5 animate-spin text-primary" />
                            <span className="text-slate-700 text-sm">Création du dossier en cours…</span>
                        </div>
                    </div>
                )
            }
        </form >
    );
};

export default DossierFormPage;
