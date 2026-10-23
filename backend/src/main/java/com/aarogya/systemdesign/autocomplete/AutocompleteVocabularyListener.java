package com.aarogya.systemdesign.autocomplete;

import com.aarogya.model.DepartmentDocument;
import com.aarogya.model.DoctorDocument;
import com.aarogya.model.MedicineDocument;
import com.aarogya.model.SpecializationDocument;
import com.aarogya.model.UserDocument;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.AfterDeleteEvent;
import org.springframework.data.mongodb.core.mapping.event.AfterSaveEvent;
import org.springframework.stereotype.Component;

/** Keeps the in-memory vocabulary aligned with authoritative MongoDB records. */
@Component
public class AutocompleteVocabularyListener extends AbstractMongoEventListener<Object> {

    private final AutocompleteTrieService trieService;

    public AutocompleteVocabularyListener(AutocompleteTrieService trieService) {
        this.trieService = trieService;
    }

    @Override
    public void onAfterSave(AfterSaveEvent<Object> event) {
        Object source = event.getSource();
        if (source instanceof DepartmentDocument
                || source instanceof DoctorDocument
                || source instanceof MedicineDocument
                || source instanceof SpecializationDocument
                || source instanceof UserDocument) {
            trieService.rebuildVocabularyFromDatabase();
        }
    }

    @Override
    public void onAfterDelete(AfterDeleteEvent<Object> event) {
        String collection = event.getCollectionName();
        if ("departments".equals(collection)
                || "doctors".equals(collection)
                || "medicines".equals(collection)
                || "specializations".equals(collection)
                || "users".equals(collection)) {
            trieService.rebuildVocabularyFromDatabase();
        }
    }
}
