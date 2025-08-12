import copy from "copy-to-clipboard";
import invariant from "invariant";
import uniqBy from "lodash/uniqBy";
import {
    DownloadIcon,
    DuplicateIcon,
    StarredIcon,
    PrintIcon,
    UnstarredIcon,
    DocumentIcon,
    NewDocumentIcon,
    ShapesIcon,
    ImportIcon,
    PinIcon,
    SearchIcon,
    UnsubscribeIcon,
    SubscribeIcon,
    MoveIcon,
    TrashIcon,
    CrossIcon,
    ArchiveIcon,
    ShuffleIcon,
    HistoryIcon,
    GraphIcon,
    UnpublishIcon,
    PublishIcon,
    CommentIcon,
    CopyIcon,
    EyeIcon,
    PadlockIcon,
    GlobeIcon,
    LogoutIcon,
    CaseSensitiveIcon,
} from "outline-icons";
import { toast } from "sonner";
import Icon from "@shared/components/Icon";
import {
    ExportContentType,
    TeamPreference,
    NavigationNode,
} from "@shared/types";
import { getEventFiles } from "@shared/utils/files";
import UserMembership from "~/models/UserMembership";
import DocumentDelete from "~/scenes/DocumentDelete";
import DocumentMove from "~/scenes/DocumentMove";
import DocumentPermanentDelete from "~/scenes/DocumentPermanentDelete";
import DocumentPublish from "~/scenes/DocumentPublish";
import DeleteDocumentsInTrash from "~/scenes/Trash/components/DeleteDocumentsInTrash";
import ConfirmationDialog from "~/components/ConfirmationDialog";
import DocumentCopy from "~/components/DocumentCopy";
import MarkdownIcon from "~/components/Icons/MarkdownIcon";
import SharePopover from "~/components/Sharing/Document";
import { getHeaderExpandedKey } from "~/components/Sidebar/components/Header";
import DocumentTemplatizeDialog from "~/components/TemplatizeDialog";
import { createAction } from "~/actions";
import {
    ActiveDocumentSection,
    DocumentSection,
    TrashSection,
} from "~/actions/sections";
import env from "~/env";
import { setPersistedState } from "~/hooks/usePersistedState";
import history from "~/utils/history";
import {
    documentInsightsPath,
    documentHistoryPath,
    homePath,
    newDocumentPath,
    newNestedDocumentPath,
    searchPath,
    documentPath,
    urlify,
    trashPath,
} from "~/utils/routeHelpers";

export const openDocument = createAction({
    name: ({ t }) => t("Open document"),
    analyticsName: "Open document",
    section: DocumentSection,
    shortcut: ["o", "d"],
    keywords: "go to",
    icon: <DocumentIcon />,
    children: ({ stores }) => {
        const nodes = stores.collections.navigationNodes.reduce(
            (acc, node) => [...acc, ...node.children],
            [] as NavigationNode[]
        );
        const documents = stores.documents.orderedData;

        return uniqBy([...documents, ...nodes], "id").map((item) => ({
            id: item.url,
            name: item.title,
            icon: item.icon ? (<Icon value={item.icon} color={item.color ?? undefined} />
            ) : (
                <DocumentIcon />
            ),
            section: DocumentSection,
            to: item.url
        }));
    },
});

export const createDocument = createAction({
    name: ({ t }) => t("New document"),
    analyticsName: "New document",
    section: DocumentSection,
    icon: <NewDocumentIcon />,
    keywords: "create",
    visible: ({ currentTeamId, activeCollectionId, stores }) => {
        if (
            activeCollectionId &&
            !stores.policies.abilities(activeCollectionId).createDocument
        ) {
            return false;
        }

        return (
            !!currentTeamId && stores.policies.abilities(currentTeamId).createDocument
        );
    },
    perform: ({ activeCollectionId, sidebarContext }) =>
        history.push(newDocumentPath(activeCollectionId), { sidebarContext }),
});

export const createDraftDocument = createAction({
    name: ({ t }) => t("New draft"),
    analyticsName: "New draft",
    section: DocumentSection,
    icon: <NewDocumentIcon />,
    keywords: "create document",
    visible: ({ currentTeamId, stores }) =>
        !!currentTeamId && stores.policies.abilities(currentTeamId).createDocument,
    perform: ({ sidebarContext }) =>
        history.push(newDocumentPath(), { sidebarContext }),
});

export const createDocumentFromTemplate = createAction({
    name: ({ t }) => t("New from template"),
    analyticsName: "New from template",
    section: DocumentSection,
    icon: <NewDocumentIcon />,
    keywords: "create",
    visible: ({
        currentTeamId,
        activeCollectionId,
        activeDocumentId,
        stores
    }) => {
        const document = activeDocumentId
            ? stores.documents.get(activeDocumentId)
            : undefined;

        if (
            !currentTeamId ||
            !document?.isTemplate ||
            !!document?.isDraft ||
            !!document?.isDeleted
        ) {
            return false;
        }

        if (activeCollectionId) {
            return stores.policies.abilities(activeCollectionId).createDocument;
        }
        return stores.policies.abilities(currentTeamId).createDocument;
    },
    perform: ({ activeCollectionId, activeDocumentId, sidebarContext }) =>
        history.push(newDocumentPath(activeCollectionId, { templateId: activeDocumentId }), { sidebarContext }),
});

export const createNestedDocument = createAction({
    name: ({ t }) => t("New nested document"),
    analyticsName: "New document",
    section: ActiveDocumentSection,
    icon: <NewDocumentIcon />,
    keywords: "create",
    visible: ({ currentTeamId, activeDocumentId, stores }) =>
        !!currentTeamId &&
        !!activeDocumentId &&
        stores.policies.abilities(currentTeamId).createDocument &&
        stores.policies.abilities(activeDocumentId).createChildDocument,
    perform: ({ activeDocumentId, sidebarContext }) =>
        history.push(newNestedDocumentPath(activeDocumentId), { sidebarContext }),
});


export const starDocument = createAction({
    name: ({ t }) => t("Star"),
    analyticsName: "Star document",
    section: ActiveDocumentSection,
    icon: <StarredIcon />,
    keywords: "favorite bookmark",
    visible: ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return false;
        }
        const document = stores.documents.get(activeDocumentId);
        return (
            !document?.isStarred && stores.policies.abilities(activeDocumentId).star
        );
    },
    perform: async ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        await document?.star();
        setPersistedState(getHeaderExpandedKey("starred"), true);
    },
});

export const unstarDocument = createAction({
    name: ({ t }) => t("Unstar"),
    analyticsName: "Unstar document",
    section: ActiveDocumentSection,
    icon: <UnstarredIcon />,
    keywords: "unfavorite unbookmark",
    visible: ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return false;
        }
        const document = stores.documents.get(activeDocumentId);
        return (
            !!document?.isStarred &&
            stores.policies.abilities(activeDocumentId).unstar
        );
    },
    perform: async ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        await document?.unstar();
    },
});

export const publishDocument = createAction({
    name: ({ t }) => t("Publish"),
    analyticsName: "Publish document",
    section: ActiveDocumentSection,
    icon: <PublishIcon />,
    visible: ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return false;
        }
        const document = stores.documents.get(activeDocumentId);
        return (
            !!document?.isDraft && stores.policies.abilities(activeDocumentId).publish
        );
    },
    perform: async ({ activeDocumentId, stores, t }) => {
        if (!activeDocumentId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        if (document?.publishedAt) {
            return;
        }

        if (document?.collectionId || document?.template) {
            await document.save(undefined, {
                publish: true,
            });
            toast.success(
                t("Published {{ documentName }}", {
                    documentName: document.noun,
                })
            );
        } else if (document) {
            stores.dialogs.openModal({
                title: t("Publish document"),
                content: <DocumentPublish document={document} />,
            });
        }
    },
});

export const unpublishDocument = createAction({
    name: ({ t }) => t("Unpublish"),
    analyticsName: "Unpublish document",
    section: ActiveDocumentSection,
    icon: <UnpublishIcon />,
    visible: ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return false;
        }
        return stores.policies.abilities(activeDocumentId).unpublish;
    },
    perform: async ({ activeDocumentId, stores, t }) => {
        if (!activeDocumentId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        if (!document) {
            return;
        }

        await document.unpublish();

        toast.success(
            t("Unpublished {{ documentName }}", {
                documentName: document.noun,
            })
        );
    },
});

export const subscribeDocument = createAction({
    name: ({ t }) => t("Subscribe"),
    analyticsName: "Subscribe to document",
    section: ActiveDocumentSection,
    icon: <SubscribeIcon />,
    visible: ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return false;
        }

        const document = stores.documents.get(activeDocumentId);

        return (
            !document?.collection?.isSubscribed &&
            !document?.isSubscribed &&
            stores.policies.abilities(activeDocumentId).subscribe
        );
    },
    perform: async ({ activeDocumentId, stores, t }) => {
        if (!activeDocumentId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        await document?.subscribe();
        toast.success(t("Subscribed to document notifications"));
    },
});

export const unsubscribeDocument = createAction({
    name: ({ t }) => t("Unsubscribe"),
    analyticsName: "Unsubscribe from document",
    section: ActiveDocumentSection,
    icon: <UnsubscribeIcon />,
    visible: ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return false;
        }

        const document = stores.documents.get(activeDocumentId);

        return (
            !!document?.collection?.isSubscribed ||
            (!!document?.isSubscribed &&
                stores.policies.abilities(activeDocumentId).unsubscribe)
        );
    },
    perform: async ({ activeDocumentId, stores, currentUserId, t }) => {
        if (!activeDocumentId || !currentUserId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);

        await document?.unsubscribe();

        toast.success(t("Unsubscribed from document notifications"));
    },
});

export const shareDocument = createAction({
    name: ({ t }) => `${t("Permissions")}…`,
    analyticsName: "Share document",
    section: ActiveDocumentSection,
    icon: <PadlockIcon />,
    visible: ({ stores, activeDocumentId }) => {
        const can = stores.policies.abilities(activeDocumentId!);
        return can.manageUsers || can.share;
    },
    perform: async ({ activeDocumentId, stores, currentUserId, t }) => {
        if (!activeDocumentId || !currentUserId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        if (!document) {
            return;
        }

        stores.dialogs.openModal({
            style: { marginBottom: -12 },
            title: t("Share this document"),
            content: (
                <SharePopover
                    document={document}
                    onRequestClose={stores.dialogs.closeAllModals}
                    visible
                />
            ),
        });
    },
});

export const downloadDocumentAsHTML = createAction({
    name: ({ t }) => t("HTML"),
    analyticsName: "Download document as HTML",
    section: ActiveDocumentSection,
    keywords: "html export",
    icon: <DownloadIcon />,
    iconInContextMenu: false,
    visible: ({ activeDocumentId, stores }) =>
        !!activeDocumentId && stores.policies.abilities(activeDocumentId).download,
    perform: async ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        await document?.download(ExportContentType.Html);
    },
});

export const downloadDocumentAsPDF = createAction({
    name: ({ t }) => t("PDF"),
    analyticsName: "Download document as PDF",
    section: ActiveDocumentSection,
    keywords: "export",
    icon: <DownloadIcon />,
    iconInContextMenu: false,
    visible: ({ activeDocumentId, stores }) =>
        !!activeDocumentId &&
        stores.policies.abilities(activeDocumentId).download &&
        env.PDF_EXPORT_ENABLED,
    perform: ({ activeDocumentId, t, stores }) => {
        if (!activeDocumentId) {
            return;
        }

        const id = toast.loading(`${t("Exporting")}…`);
        const document = stores.documents.get(activeDocumentId);
        return document
            ?.download(ExportContentType.Pdf)
            .finally(() => id && toast.dismiss(id));
    },
});

export const downloadDocumentAsMarkdown = createAction({
    name: ({ t }) => t("Markdown"),
    analyticsName: "Download document as Markdown",
    section: ActiveDocumentSection,
    keywords: "md markdown export",
    icon: <DownloadIcon />,
    iconInContextMenu: false,
    visible: ({ activeDocumentId, stores }) =>
        !!activeDocumentId && stores.policies.abilities(activeDocumentId).download,
    perform: async ({ activeDocumentId, stores }) => {
        if (!activeDocumentId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        await document?.download(ExportContentType.Markdown);
    },
});

export const downloadDocument = createAction({
    name: ({ t, isContextMenu }) =>
        isContextMenu ? t("Download") : t("Download document"),
    analyticsName: "Download document",
    section: ActiveDocumentSection,
    icon: <DownloadIcon />,
    keywords: "export",
    visible: ({ activeDocumentId, stores }) =>
        !!activeDocumentId && stores.policies.abilities(activeDocumentId).download,
    children: [
        downloadDocumentAsHTML,
        downloadDocumentAsPDF,
        downloadDocumentAsMarkdown,
    ],
});

export const copyDocumentAsMarkdown = createAction({
    name: ({ t }) => t("Copy as Markdown"),
    section: ActiveDocumentSection,
    keywords: "clipboard",
    icon: <MarkdownIcon />,
    iconInContextMenu: false,
    visible: ({ activeDocumentId, stores }) =>
        !!activeDocumentId && stores.policies.abilities(activeDocumentId).download,
    perform: ({ stores, activeDocumentId, t }) => {
        const document = activeDocumentId
            ? stores.documents.get(activeDocumentId)
            : undefined;
        if (document) {
            copy(document.toMarkdown());
            toast.success(t("Markdown copied to clipboard"));
        }
    },
});

export const copyDocumentAsPlainText = createAction({
    name: ({ t }) => t("Copy as text"),
    section: ActiveDocumentSection,
    keywords: "clipboard",
    icon: <CaseSensitiveIcon />,
    iconInContextMenu: false,
    visible: ({ activeDocumentId, stores }) =>
        !!activeDocumentId && stores.policies.abilities(activeDocumentId).download,
    perform: ({ stores, activeDocumentId, t }) => {
        const document = activeDocumentId
            ? stores.documents.get(activeDocumentId)
            : undefined;
        if (document) {
            copy(document.toPlainText());
            toast.success(t("Text copied to clipboard"));
        }
    },
});

export const copyDocumentShareLink = createAction({
    name: ({ t }) => t("Copy public link"),
    section: ActiveDocumentSection,
    keywords: "clipboard share",
    icon: <GlobeIcon />,
    iconInContextMenu: false,
    visible: ({ activeDocumentId, stores }) =>
        !!activeDocumentId &&
        !!stores.shares.getByDocumentId(activeDocumentId)?.published,
    perform: ({ stores, activeDocumentId, t }) => {
        if (!activeDocumentId) {
            return;
        }
        const share = stores.shares.getByDocumentId(activeDocumentId);
        if (share) {
            copy(share.url);
            toast.success(t("Link copied to clipboard"));
        }
    },
});

export const copyDocumentLink = createAction({
    name: ({ t }) => t("Copy link"),
    section: ActiveDocumentSection,
    keywords: "clipboard",
    icon: <CopyIcon />,
    iconInContextMenu: false,
    visible: ({ activeDocumentId }) => !!activeDocumentId,
    perform: ({ stores, activeDocumentId, t }) => {
        const document = activeDocumentId
            ? stores.documents.get(activeDocumentId)
            : undefined;
        if (document) {
            copy(urlify(documentPath(document)));
            toast.success(t("Link copied to clipboard"));
        }
    },
});

export const copyDocument = createAction({
    name: ({ t }) => t("Copy"),
    analyticsName: "Copy document",
    section: ActiveDocumentSection,
    icon: <CopyIcon />,
    keywords: "clipboard",
    children: [
        copyDocumentLink,
        copyDocumentShareLink,
        copyDocumentAsMarkdown,
        copyDocumentAsPlainText,
    ],
});

export const duplicateDocument = createAction({
    name: ({ t, isContextMenu }) =>
        isContextMenu ? t("Duplicate") : t("Duplicate document"),
    analyticsName: "Duplicate document",
    section: ActiveDocumentSection,
    icon: <DuplicateIcon />,
    keywords: "copy",
    visible: ({ activeDocumentId, stores }) =>
        !!activeDocumentId && stores.policies.abilities(activeDocumentId).duplicate,
    perform: async ({ activeDocumentId, t, stores }) => {
        if (!activeDocumentId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        invariant(document, "Document must exist");

        stores.dialogs.openModal({
            title: t("Copy document"),
            content: (
                <DocumentCopy
                    document={document}
                    onSubmit={(response) => {
                        stores.dialogs.closeAllModals();
                        history.push(documentPath(response[0]));
                    }}
                />
            ),
        });
    },
});

/**
 * Pin a document to a collection. Pinned documents will be displayed at the top
 * of the collection for all collection members to see.
 */
export const pinDocumentToCollection = createAction({
    name: ({ activeDocumentId = "", t, stores }) => {
        const selectedDocument = stores.documents.get(activeDocumentId);
        const collectionName = selectedDocument
            ? stores.documents.getCollectionForDocument(selectedDocument)?.name
            : t("collection");

        return t("Pin to {{collectionName}}", {
            collectionName,
        });
    },
    analyticsName: "Pin document to collection",
    section: ActiveDocumentSection,
    icon: <PinIcon />,
    iconInContextMenu: false,
    visible: ({ activeCollectionId, activeDocumentId, stores }) => {
        if (!activeDocumentId || !activeCollectionId) {
            return false;
        }

        const document = stores.documents.get(activeDocumentId);
        return (
            !!stores.policies.abilities(activeDocumentId).pin && !document?.pinned
        );
    },
    perform: async ({ activeDocumentId, activeCollectionId, t, stores }) => {
        if (!activeDocumentId || !activeCollectionId) {
            return;
        }

        const document = stores.documents.get(activeDocumentId);
        await document?.pin(document.collectionId);

        const collection = stores.collections.get(activeCollectionId);

        if (!collection || !location.pathname.startsWith(collection?.url)) {
            toast.success(t("Pinned to collection"));
        }
    },
});

/**
 * Pin a document to team home. Pinned documents will be displayed at the top
 * of the home screen for all team members to see.
 */
export const pinDocumentToHome = createAction({
    name: ({ t }) => t("Pin to home"),
    analyticsName: "Pin document to home",
    section: ActiveDocumentSection,
    icon: <PinIcon />,
    iconInContextMenu: false,
    visible: ({ activeDocumentId, currentTeamId, stores }) => {
        if (!currentTeamId || !activeDocumentId) {
            return false;
        }

        const document = stores.documents.get(activeDocumentId);

        return (
            !!stores.policies.abilities(activeDocumentId).pinToHome &&
            !document?.pinnedToHome
        );
    },
    perform: async ({ activeDocumentId, location, t, stores }) => {
        if (!activeDocumentId) {
            return;
        }
        const document = stores.documents.get(activeDocumentId);

        await document?.pin();

        if (location.pathname !== homePath()) {
            toast.success(t("Pinned to home"));
        }
    },
});

export const pinDocument = createAction({
    name: ({ t }) => t("Pin"),
    analyticsName: "Pin document",
    section: ActiveDocumentSection,
    icon: <PinIcon />,
    children: [pinDocumentToCollection, pinDocumentToHome],
});

export const searchInDocument = createAction({
    name: ({ t }) => t("Search in document"),
    analyticsName: "Search document",
    section: ActiveDocumentSection,
    shortcut: [`Meta+/`],
    icon: <SearchIcon />,
    visible: ({ stores, activeDocumentId }) => {
        if (!activeDocumentId) {
            return false;
        }
        const document = stores.documents.get(activeDocumentId);
        return !!document?.isActive;
    },
    perform: ({ activeDocumentId }) => {
        history.push(searchPath({ documentId: activeDocumentId }));
    },
});

export const printDocument = createAction({
    name: ({ t, isContextMenu }) =>
        isContextMenu ? t("Print") : t("Print document"),
    analyticsName: "Print document",
    section: ActiveDocumentSection,
    icon: <PrintIcon />,
    visible: ({ activeDocumentId }) => !!(activeDocumentId && window.print),
    perform: () => {
        queueMicrotask(window.print);
    },
});

export const importDocument = createAction({
    name: ({ t }) => t("Import document"),
    analyticsName: "Import document",
    section: DocumentSection,
    icon: <ImportIcon />,
    keywords: "upload",
    visible: ({ activeCollectionId, activeDocumentId, stores }) => {
        if (activeDocumentId) {
            return !!stores.policies.abilities(activeDocumentId).createChildDocument;
        }

        if (activeCollectionId) {
            return !!stores.policies.abilities(activeCollectionId).update;
        }

        return false;
    },
    perform: ({ activeDocumentId, activeCollectionId, stores }) => {
        const { documents } = stores;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = documents.importFileTypes.join(", ");

        input.onchange = async (ev) => {
            const files = getEventFiles(ev);

            const file = files[0];

            try {
                const document = await documents.import(
                    file,
                    activeDocumentId,
                    activeCollectionId,
                    { publish: true }
                );
                history.push(document.url);
            } catch (err) {
                toast.error(err.message);
            }
        };

        input.click();
    },
});

export const createTemplateFromDocument = createAction({
    name: ({ t }) => t("Templatize"),
    analyticsName: "Templatize document",
    section: ActiveDocumentSection,
    icon: <ShapesIcon />,
    keywords: "new create template",
    visible: ({ activeCollectionId, activeDocumentId, stores }) => {
        const document = activeDocumentId
            ? stores.documents.get(activeDocumentId)
            : undefined;
        if (document?.isTemplate || !document?.isActive) {
            return false;
        }
        return !!(!!activeCollectionId &&
            stores.policies.abilities(activeCollectionId).updateDocument
        );
    },
    perform: ({ activeDocumentId, stores, t, event }) => {
        if (!activeDocumentId) {
            return;
        }
        event?.preventDefault();
        event?.stopPropagation();
        stores.dialogs.openModal({
            title: "Create template",
            content: <DocumentTemplatizeDialog documentId={activeDocumentId} />
        });
    },
});

export const openRandomDocument = createAction({
    id: "random",
    name: ({ t }) => t(`Open random document`),
    analyticsName: "Open random document",
    section: DocumentSection,
    icon: <ShuffleIcon />,
    perform: ({ stores, activeDocumentId }) => {
        const nodes = stores.collections.navigationNodes
            .reduce((acc, node) => [...acc, ...node.children], [] as NavigationNode[])
            .filter((node) => node.id !== activeDocumentId);

        const random = nodes[Math.round(Math.random() * nodes.length)];

        if (random) {
            history.push(random.url);
        };
    },
});

export const searchDocumentsForQuery = (query: string) =>
    createAction({
        id: "search",
        name: ({ t }) =>
            t(`Search documents for "{{searchQuery}}"`, { searchQuery: query }),
        analyticsName: "Search document",
        section: DocumentSection,
        icon: <SearchIcon />,
        to: searchPath({ query }),
        visible: ({ location }) => location.pathname !== searchPath(),
    });



