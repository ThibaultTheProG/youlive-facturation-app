SELECT 
    f.id,
    f.user_id,
    f.type,
    r.honoraires_agent, -- ✅ Récupération des honoraires depuis relations_contrats
    f.retrocession,
    f.statut_paiement,
    f.created_at,
    f.updated_at,
    f.numero,
    f.apporteur,
    f.apporteur_amount,
    c.date_signature,
    p.numero_mandat,
    r.user_id,
    r.vat_rate,

    -- Informations du conseiller (utilisateur)
    u.id AS conseiller_id,
    u.idapimo AS conseiller_idapimo,
    u.prenom AS conseiller_prenom,
    u.nom AS conseiller_nom,
    u.email AS conseiller_email,
    u.telephone AS conseiller_telephone,
    u.mobile AS conseiller_mobile,
    u.adresse AS conseiller_adresse,
    u.siren AS conseiller_siren,
    u.tva AS conseiller_tva,
    u.chiffre_affaires AS conseiller_chiffre_affaires,
    u.retrocession AS conseiller_retrocession,

    -- Informations du contrat
    c.id AS contrat_id,
    c.statut AS contrat_statut,
    c.price AS contrat_price,
    c.price_net AS contrat_price_net,

    -- Informations de la propriété
    p.id AS propriete_id,
    p.adresse AS propriete_adresse,

    -- Informations du filleul (utilisateur associé à relations_contrats.user_id)
    filleul.prenom AS filleul_prenom,
    filleul.nom AS filleul_nom,

    -- Agrégation des acheteurs sous format JSON
    COALESCE(
        json_agg(
            DISTINCT CASE 
                WHEN cc_acheteur.type = 1 THEN 
                    jsonb_build_object(
                        'prenom', acheteur.prenom,
                        'nom', acheteur.nom,
                        'email', acheteur.email,
                        'mobile', acheteur.mobile,
                        'adresse', acheteur.adresse,
                        'ville', jsonb_build_object(
                          'name', acheteur.ville,
                          'zipcode', acheteur.cp
                        )
                    )
            END
        ) FILTER (WHERE cc_acheteur.type = 1), '[]'
    ) AS acheteurs,

    -- Agrégation des propriétaires sous format JSON
    COALESCE(
        json_agg(
            DISTINCT CASE 
                WHEN cc_proprietaire.type = 2 THEN 
                    jsonb_build_object(
                        'prenom', proprietaire.prenom,
                        'nom', proprietaire.nom,
                        'email', proprietaire.email,
                        'mobile', proprietaire.mobile,
                        'adresse', proprietaire.adresse,
                        'ville', jsonb_build_object(
                          'name', proprietaire.ville,
                          'zipcode', proprietaire.cp
                        )
                    )
            END
        ) FILTER (WHERE cc_proprietaire.type = 2), '[]'
    ) AS proprietaires

FROM factures f
JOIN relations_contrats r ON f.relation_id = r.id  -- ✅ Récupération des honoraires_agent
JOIN utilisateurs u ON f.user_id = u.id
JOIN contrats c ON r.contrat_id = c.id
JOIN property p ON c.id = p.contrat_id

LEFT JOIN utilisateurs filleul ON r.user_id = filleul.id

-- Jointure pour récupérer les acheteurs (type = 1)
LEFT JOIN contacts_contrats cc_acheteur ON c.id = cc_acheteur.contrat_id AND cc_acheteur.type = 1
LEFT JOIN contacts acheteur ON cc_acheteur.contact_id = acheteur.contact_apimo_id

-- Jointure pour récupérer les propriétaires (type = 2)
LEFT JOIN contacts_contrats cc_proprietaire ON c.id = cc_proprietaire.contrat_id AND cc_proprietaire.type = 2
LEFT JOIN contacts proprietaire ON cc_proprietaire.contact_id = proprietaire.contact_apimo_id

WHERE f.id = $1
GROUP BY 
    f.id, u.id, c.id, p.id, r.honoraires_agent, r.user_id, filleul.prenom, filleul.nom, r.vat_rate;