package com.aarogya.repository;

import com.aarogya.model.CrawlerDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CrawlerDocumentRepository extends MongoRepository<CrawlerDocument, String> {
    Optional<CrawlerDocument> findByUrl(String url);
    Optional<CrawlerDocument> findByContentHash(String contentHash);
    List<CrawlerDocument> findByTitleContainingIgnoreCaseOrContentSnippetContainingIgnoreCase(String title, String snippet);
    long countByDomain(String domain);
    List<CrawlerDocument> findByDomain(String domain);
    void deleteByDomain(String domain);
}
