// import React from 'react';
// import { View, Text, FlatList, StyleSheet } from 'react-native';
// import { transactionsDB, Transaction } from './database';

// const TransactionsList = () => {
//   const renderItem = ({ item }: { item: Transaction }) => (
//     <View style={styles.item}>
//       <Text style={styles.name}>{item.name}</Text>
//       <Text style={styles.category}>{item.category}</Text>
//       <Text style={item.amount >= 0 ? styles.amountIncome : styles.amountExpense}>
//         {item.amount >= 0 ? `+${item.amount}` : `${item.amount}`}
//       </Text>
//       <Text style={styles.date}>{item.date}</Text>
//     </View>
//   );

//   return (
//     <FlatList
//       data={transactionsDB}
//       keyExtractor={(item) => item.id}
//       renderItem={renderItem}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   item: {
//     padding: 15,
//     marginVertical: 5,
//     marginHorizontal: 10,
//     borderRadius: 8,
//     backgroundColor: '#f2f2f2',
//   },
//   name: {
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   category: {
//     color: '#555',
//   },
//   amountIncome: {
//     color: 'green',
//     fontWeight: 'bold',
//   },
//   amountExpense: {
//     color: 'red',
//     fontWeight: 'bold',
//   },
//   date: {
//     color: '#888',
//     fontSize: 12,
//   },
// });

// export default TransactionsList;