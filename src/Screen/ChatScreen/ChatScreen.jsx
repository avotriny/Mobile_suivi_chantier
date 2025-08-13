// Screen/ChatScreen/ChatScreen.js
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Platform,
  Alert,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Send, Composer } from 'react-native-gifted-chat';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
  Usage :
    navigation.navigate('ChatScreen', {
      senderId: currentUser._id,           // ou currentUser.id
      receiverId: user._id,
      recipient: user,                     // optionnel: { _id, name, avatar }
      currentUser: currentUser             // optionnel (si pas stocké en AsyncStorage)
    });

  Endpoints (adapter si besoin) :
    GET  http://10.0.2.2:5000/api/messages/:senderId/:receiverId
    POST http://10.0.2.2:5000/api/messages  -> { senderId, receiverId, text, file }
*/

export default function ChatScreen({ navigation, route }) {
  const params = route?.params ?? {};
  const [currentUser, setCurrentUser] = useState(params.currentUser ?? null);
  const [senderId, setSenderId] = useState(params.senderId ?? null);
  const [receiverId, setReceiverId] = useState(params.receiverId ?? null);
  const [recipient, setRecipient] = useState(params.recipient ?? null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [uploading, setUploading] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        // si currentUser pas passé en params, le récupérer depuis AsyncStorage
        if (!currentUser) {
          const stored = await AsyncStorage.getItem('currentUser');
          if (stored) setCurrentUser(JSON.parse(stored));
        }
        // set sender id depuis currentUser si absent
        if (!senderId) {
          const stored = await AsyncStorage.getItem('currentUser');
          if (stored) {
            const u = JSON.parse(stored);
            setSenderId(u._id ?? u.id);
            if (!currentUser) setCurrentUser(u);
          }
        }
      } catch (e) {
        console.warn('Chat init error', e);
      }
    })();

    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (params.recipient) setRecipient(params.recipient);
    if (params.senderId) setSenderId(params.senderId);
    if (params.receiverId) setReceiverId(params.receiverId);
  }, [params]);

  // fetch messages from backend and convert to GiftedChat format
  const fetchMessages = useCallback(async () => {
    const s = senderId ?? (currentUser && (currentUser._id ?? currentUser.id));
    const r = receiverId;
    if (!s || !r) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = currentUser?.token ?? (await AsyncStorage.getItem('authToken'));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://10.0.2.2:5000/api/messages/${s}/${r}`, { headers });

      // transform messages (adapter si shape différente)
      const data = Array.isArray(res.data) ? res.data : (res.data.result ?? []);
      const mapped = data.map(m => ({
        _id: m._id ?? `${m.senderId}-${m.createdAt}-${Math.random()}`,
        text: m.text ?? '',
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        user: {
          _id: m.senderId,
          name: m.senderName ?? m.uName ?? 'Utilisateur',
          avatar: m.senderAvatar ?? m.uImage ?? null,
        },
        image: m.file ?? m.image ?? null,
        raw: m,
      })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (mountedRef.current) setMessages(mapped);
    } catch (err) {
      console.warn('fetch messages error', err?.response?.data ?? err.message ?? err);
      Alert.alert('Erreur', "Impossible de charger la conversation.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [senderId, receiverId, currentUser]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // handle image pick -> upload to firebase -> post message
  const pickAndSendImage = useCallback(async () => {
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
      });

      // modern image-picker returns an object; handle cancel and missing assets
      if (!res || res.didCancel) return;
      const asset = res.assets?.[0];
      if (!asset) return;
      const localUri = asset.uri;
      if (!localUri) return;

      // optimistic UI : crée un message local "en cours"
      const tempId = `tmp-${Date.now()}`;
      const localMsg = {
        _id: tempId,
        text: '',
        createdAt: new Date(),
        user: {
          _id: senderId,
          name: currentUser?.name ?? 'Vous',
          avatar: currentUser?.photoURL ?? null,
        },
        image: localUri,
        pending: true,
      };
      setMessages(prev => [localMsg, ...prev]);

      // upload to firebase
      setUploading(true);
      let filename = localUri.split('/').pop();
      const path = `messages/${Date.now()}_${filename}`;
      const ref = storage().ref(path);

      // putFile supporte content:// et file:// en général
      await ref.putFile(localUri);
      const fileUrl = await ref.getDownloadURL();

      // send to backend
      const token = currentUser?.token ?? (await AsyncStorage.getItem('authToken'));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const body = {
        senderId,
        receiverId,
        text: '',
        file: fileUrl,
      };
      const resp = await axios.post('http://10.0.2.2:5000/api/messages', body, { headers });

      const saved = resp.data;
      const giftMsg = {
        _id: saved._id ?? `${saved.senderId}-${Date.now()}`,
        text: saved.text ?? '',
        createdAt: saved.createdAt ? new Date(saved.createdAt) : new Date(),
        user: {
          _id: saved.senderId,
          name: saved.senderName ?? currentUser?.name,
          avatar: saved.senderAvatar ?? currentUser?.photoURL ?? null,
        },
        image: saved.file ?? saved.image ?? fileUrl,
        raw: saved,
      };

      // remplace le message temporaire par celui du serveur
      setMessages(prev => [giftMsg, ...prev.filter(m => m._id !== tempId)]);
    } catch (err) {
      console.warn('pickAndSendImage error', err);
      Alert.alert('Erreur', "Impossible d'envoyer l'image.");
      // retirer le message temporaire s'il reste
      setMessages(prev => prev.filter(m => !m.pending));
    } finally {
      setUploading(false);
    }
  }, [senderId, receiverId, currentUser]);

  const onSend = useCallback(async (msgs = []) => {
    if (!msgs || msgs.length === 0) return;
    const msg = msgs[0];
    const text = msg.text ?? '';

    // create optimistic message in UI
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      text,
      createdAt: new Date(),
      user: {
        _id: senderId,
        name: currentUser?.name ?? 'Vous',
        avatar: currentUser?.photoURL ?? null,
      },
      pending: true,
    };
    setMessages(previous => [optimistic, ...previous]);

    setSending(true);
    try {
      const token = currentUser?.token ?? (await AsyncStorage.getItem('authToken'));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const body = { senderId, receiverId, text };
      const res = await axios.post('http://10.0.2.2:5000/api/messages', body, { headers });

      const saved = res.data;
      const giftMsg = {
        _id: saved._id ?? `${saved.senderId}-${Date.now()}`,
        text: saved.text ?? text,
        createdAt: saved.createdAt ? new Date(saved.createdAt) : new Date(),
        user: {
          _id: saved.senderId,
          name: saved.senderName ?? currentUser?.name,
          avatar: saved.senderAvatar ?? currentUser?.photoURL ?? null,
        },
        image: saved.file ?? saved.image ?? null,
        raw: saved,
      };

      // replace temp message
      setMessages(prev => [giftMsg, ...prev.filter(m => m._id !== tempId)]);
    } catch (err) {
      console.warn('send text error', err);
      Alert.alert('Erreur', "Échec de l'envoi du message.");
      // remove optimistic
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setSending(false);
    }
  }, [senderId, receiverId, currentUser]);

  // GiftedChat custom renderers (Bubble, Send, InputToolbar)
  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        left: { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 },
        right: { backgroundColor: '#228B22' },
      }}
      textStyle={{ left: { color: '#222' }, right: { color: '#fff' } }}
    />
  );

  const renderSend = (props) => (
    <Send {...props}>
      <View style={styles.sendButton}>
        <MaterialCommunityIcons name="send" size={20} color="#fff" />
      </View>
    </Send>
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={{ borderTopWidth: 1, borderTopColor: '#eee', padding: 6 }}
      primaryStyle={{ alignItems: 'center' }}
    />
  );

  const renderComposer = (props) => (
    <Composer {...props} textInputStyle={styles.composer} />
  );

  const renderActions = (props) => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity onPress={pickAndSendImage} style={styles.actionBtn}>
        <MaterialCommunityIcons name="paperclip" size={24} color="#555" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#228B22" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{recipient?.name ?? 'Conversation'}</Text>
          <Text style={styles.headerSub}>{recipient?.email ?? ''}</Text>
        </View>
      </View>

      {/* GiftedChat */}
      <GiftedChat
        messages={messages}
        onSend={msgs => onSend(msgs)}
        user={{ _id: senderId ?? (currentUser?._id ?? currentUser?.id), name: currentUser?.name }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}
        renderActions={renderActions}
        placeholder="Écrire un message..."
        alwaysShowSend
      />

      {(uploading || sending) && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 8 }}>{uploading ? 'Envoi image...' : 'Envoi...'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    height: 64,
    backgroundColor: '#228B22',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerSub: { color: '#e6ffe6', fontSize: 12 },

  actionsContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 6 },
  actionBtn: { paddingHorizontal: 6, paddingVertical: 6 },

  sendButton: {
    backgroundColor: '#228B22',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
  },
  composer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 6 : 10,
    borderWidth: 1,
    borderColor: '#eee',
  },

  uploadOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
