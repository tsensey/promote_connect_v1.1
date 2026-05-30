-- 1. Trigger pour la création de tickets de support
CREATE OR REPLACE FUNCTION notify_admins_on_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id uuid;
BEGIN
    FOR v_admin_id IN SELECT id FROM profiles WHERE role = 'admin' LOOP
        INSERT INTO notifications (profile_id, sender_id, type, data)
        VALUES (v_admin_id, NEW.profile_id, 'new_ticket', jsonb_build_object('ticket_id', NEW.id, 'subject', NEW.subject));
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_ticket ON support_tickets;
CREATE TRIGGER trg_notify_admins_on_new_ticket
AFTER INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION notify_admins_on_new_ticket();

-- 2. Trigger pour les réponses aux tickets
CREATE OR REPLACE FUNCTION notify_on_ticket_reply()
RETURNS TRIGGER AS $$
DECLARE
    v_ticket_owner uuid;
    v_admin_id uuid;
BEGIN
    -- Récupérer le propriétaire du ticket
    SELECT profile_id INTO v_ticket_owner FROM support_tickets WHERE id = NEW.ticket_id;

    IF NEW.is_admin = true THEN
        -- Admin a répondu, notifier l'utilisateur (sauf si c'est lui-même, peu probable)
        IF v_ticket_owner != NEW.sender_id THEN
            INSERT INTO notifications (profile_id, sender_id, type, data)
            VALUES (v_ticket_owner, NEW.sender_id, 'ticket_reply', jsonb_build_object('ticket_id', NEW.ticket_id));
        END IF;
    ELSE
        -- Utilisateur a répondu, notifier tous les admins
        FOR v_admin_id IN SELECT id FROM profiles WHERE role = 'admin' LOOP
            INSERT INTO notifications (profile_id, sender_id, type, data)
            VALUES (v_admin_id, NEW.sender_id, 'ticket_reply', jsonb_build_object('ticket_id', NEW.ticket_id));
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_ticket_reply ON support_messages;
CREATE TRIGGER trg_notify_on_ticket_reply
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION notify_on_ticket_reply();

-- 3. Trigger pour les messages privés (chat)
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_participant_a uuid;
    v_participant_b uuid;
    v_receiver_id uuid;
BEGIN
    SELECT participant_a, participant_b INTO v_participant_a, v_participant_b 
    FROM conversations WHERE id = NEW.conversation_id;

    IF v_participant_a = NEW.sender_id THEN
        v_receiver_id := v_participant_b;
    ELSE
        v_receiver_id := v_participant_a;
    END IF;

    IF v_receiver_id IS NOT NULL THEN
        INSERT INTO notifications (profile_id, sender_id, type, data)
        VALUES (v_receiver_id, NEW.sender_id, 'new_message', jsonb_build_object('conversation_id', NEW.conversation_id, 'content_preview', substring(NEW.content from 1 for 60), 'attachment_type', NEW.attachment_type));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_new_message ON messages;
CREATE TRIGGER trg_notify_on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_message();
